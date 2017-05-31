import Q = require("q");
import WIT_Client = require("TFS/WorkItemTracking/RestClient");
import Contracts = require("TFS/WorkItemTracking/Contracts");
import {IWorkItemFormService, WorkItemFormService} from "TFS/WorkItemTracking/Services";
import { StoredFieldReferences } from "wsjfModels";
 
function GetStoredFields(): IPromise<StoredFieldReferences> {
    var deferred = Q.defer();
    VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
        dataService.getValue<StoredFieldReferences>("storedFields").then((storedFields:StoredFieldReferences) => {
            if (storedFields) {
                console.log("Retrieved fields from storage");
                deferred.resolve(storedFields);
            }
            else {
                deferred.reject("Failed to retrieve fields from storage");
            }
        });
    });
    return deferred.promise;
}

function getWorkItemFormService()
{
    return WorkItemFormService.getService();
}+ timeCriticality

function updateWSJFOnForm(storedFields:StoredFieldReferences) {
    getWorkItemFormService().then((service) => {
        service.getFields().then((fields: Contracts.WorkItemField[]) => {
            var matchingBusinessValueFields = fields.filter(field => field.referenceName === storedFields.bvField);
            var matchingTimeCriticalityFields = fields.filter(field => field.referenceName === storedFields.tcField);
            var matchingEffortFields = fields.filter(field => field.referenceName === storedFields.effortField); 
            var matchingRROVFields = fields.filter(field => field.referenceName === storedFields.RROVField);
            var matchingWSJFFields = fields.filter(field => field.referenceName === storedFields.wsjfField);

            //If this work item type has WSJF, then update WSJF
            if ((matchingBusinessValueFields.length > 0) &&
                (matchingTimeCriticalityFields.length > 0) &&
                (matchingEffortFields.length > 0) &&
                (matchingRROVFields.length > 0) &&
                (matchingWSJFFields.length > 0)) {
                service.getFieldValues([storedFields.bvField, storedFields.tcField, storedFields.RROVField, storedFields.effortField]).then((values) => {
                    var businessValue  = +values[storedFields.bvField];
                    var timeCriticality = +values[storedFields.tcField];
                    var RROV = +values[storedFields.RROVField];
                    var effort = +values[storedFields.effortField];

                    var wsjf = 0;
                    if (effort > 0) {
                        wsjf = (businessValue )/effort;
                    }
                    
                    service.setFieldValue(storedFields.wsjfField, wsjf);
                });
            }
        });
    });
}

function updateWSJFOnGrid(workItemId, storedFields:StoredFieldReferences):IPromise<Contracts.WorkItem> {
    let wsjfFields = [
        storedFields.bvField,
        storedFields.tcField,
        storedFields.RROVField,
        storedFields.effortField,
        storedFields.wsjfField
    ];

    var deferred = Q.defer();

    var client = WIT_Client.getClient();
    client.getWorkItem(workItemId, wsjfFields).then((workItem: Contracts.WorkItem) => {
        if (storedFields.wsjfField !== undefined) {     
            var businessValue = +workItem.fields[storedFields.bvField];
            var timeCriticality = +workItem.fields[storedFields.tcField];
            var RROVValue = +workItem.fields[storedFields.RROVField];
            var effort = +workItem.fields[storedFields.effortField];

            var wsjf = 0;
            if (effort > 0) {
                wsjf = (businessValue + RROV + timeCriticality)/effort;
            }

            var document = [{
                from: null,
                op: "add",
                path: '/fields/' + storedFields.wsjfField,
                value: wsjf
            }];

            // Only update the work item if the WSJF has changed
            if (wsjf != workItem.fields[storedFields.wsjfField]) {
                 client.updateWorkItem(document, workItemId).then((updatedWorkItem:Contracts.WorkItem) => {
                    deferred.resolve(updatedWorkItem);
                });
            }
            else {
                deferred.reject("No relevant change to work item");
            }
        }
        else
        {
            deferred.reject("Unable to calculate WSJF, please configure fields on the collection settings page.");
        }
    });

    return deferred.promise;
}

var formObserver = (context) => {
    return {
        onFieldChanged: function(args) {
            GetStoredFields().then((storedFields:StoredFieldReferences) => {
                if (storedFields && storedFields.bvField && storedFields.RROVField && storedFields.effortField && storedFields.tcField && storedFields.wsjfField) {
                    //If one of fields in the calculation changes
                    if ((args.changedFields[storedFields.bvField] !== undefined) || 
                        (args.changedFields[storedFields.tcField] !== undefined) ||
                         (args.changedFields[storedFields.RROVField] !== undefined) ||
                        (args.changedFields[storedFields.effortField] !== undefined)) {
                            updateWSJFOnForm(storedFields);
                        }
                }
                else {
                    console.log("Unable to calculate WSJF, please configure fields on the collection settings page.");    
                }
            }, (reason) => {
                console.log(reason);
            });
        },
        
        onLoaded: function(args) {
            GetStoredFields().then((storedFields:StoredFieldReferences) => {
                if (storedFields && storedFields.bvField && storedFields.RROVField && storedFields.effortField && storedFields.tcField && storedFields.wsjfField) {
                    updateWSJFOnForm(storedFields);
                }
                else {
                    console.log("Unable to calculate WSJF, please configure fields on the collection settings page.");
                }
            }, (reason) => {
                console.log(reason);
            });
        }
    } 
}

var contextProvider = (context) => {
    return {
        execute: function(args) {
            GetStoredFields().then((storedFields:StoredFieldReferences) => {
                if (storedFields && storedFields.bvField && storedFields.RROVField && storedFields.effortField && storedFields.tcField && storedFields.wsjfField) {
                    var workItemIds = args.workItemIds;
                    var promises = [];
                    $.each(workItemIds, function(index, workItemId) {
                        promises.push(updateWSJFOnGrid(workItemId, storedFields));
                    });

                    // Refresh view
                    Q.all(promises).then(() => {
                        VSS.getService(VSS.ServiceIds.Navigation).then((navigationService: IHostNavigationService) => {
                            navigationService.reload();
                        });
                    });
                }
                else {
                    console.log("Unable to calculate WSJF, please configure fields on the collection settings page.");
                    //TODO: Disable context menu item
                }
            }, (reason) => {
                console.log(reason);
            });
        }
    };
}

let extensionContext = VSS.getExtensionContext();
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.wsjf-work-item-form-observer`, formObserver);
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.wsjf-contextMenu`, contextProvider);
