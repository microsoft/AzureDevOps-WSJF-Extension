import Q = require("q");

import TFS_Wit_Contracts = require("TFS/WorkItemTracking/Contracts");
import TFS_Wit_Client = require("TFS/WorkItemTracking/RestClient");
import TFS_Wit_Services = require("TFS/WorkItemTracking/Services");

import { StoredFieldReferences } from "./rpnModels";
 
function GetStoredFields(): IPromise<any> {
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
    return TFS_Wit_Services.WorkItemFormService.getService();
}

function updateRPNOnForm(storedFields:StoredFieldReferences) {
    getWorkItemFormService().then((service) => {
        service.getFields().then((fields: TFS_Wit_Contracts.WorkItemField[]) => {
            var matchingSeverityValueFields = fields.filter(field => field.referenceName === storedFields.svField);
            var matchingOccurenceFields = fields.filter(field => field.referenceName === storedFields.ocField);
            var matchingDetectionFields = fields.filter(field => field.referenceName === storedFields.dtField);
            var matchingUsersAffectedFields = fields.filter(field => field.referenceName === storedFields.usersField); 
            var matchingRPNFields = fields.filter(field => field.referenceName === storedFields.rpnField);

            //If this work item type has RPN, then update RPN
            if ((matchingSeverityValueFields.length > 0) &&
                (matchingOccurenceFields.length > 0) &&
                (matchingDetectionFields.length > 0) &&
                (matchingUsersAffectedFields.length > 0) &&
                (matchingRPNFields.length > 0)) {
                service.getFieldValues([storedFields.svField, storedFields.ocField, storedFields.dtField, storedFields.usersField]).then((values) => {
                    var severityValue  = +values[storedFields.svField];
                    var Occurence = +values[storedFields.ocField];
                    var Detection = +values[storedFields.dtField];
                    var UsersAffected = +values[storedFields.usersField];

                    var rpn = 0;
                    if (UsersAffected > 0) {
                        rpn = (severityValue * Occurence * Detection *UsersAffected);
                    }
                    
                    service.setFieldValue(storedFields.rpnField, rpn);
                });
            }
        });
    });
}

function updateRPNOnGrid(workItemId, storedFields:StoredFieldReferences):IPromise<any> {
    let rpnFields = [
        storedFields.svField,
        storedFields.ocField,
        storedFields.dtField,
        storedFields.usersField,
        storedFields.rpnField
    ];

    var deferred = Q.defer();

    var client = TFS_Wit_Client.getClient();
    client.getWorkItem(workItemId, rpnFields).then((workItem: TFS_Wit_Contracts.WorkItem) => {
        if (storedFields.rpnField !== undefined && storedFields.dtField !== undefined) {     
            var severityValue = +workItem.fields[storedFields.svField];
            var Occurence = +workItem.fields[storedFields.ocField];
            var Detection = +workItem.fields [storedFields.dtField];
            var UsersAffected = +workItem.fields[storedFields.usersField];

            var rpn = 0;
            if (UsersAffected > 0) {
                rpn = (severityValue * Occurence * Detection * UsersAffected);
            }

            var document = [{
                from: null,
                op: "add",
                path: '/fields/' + storedFields.rpnField,
                value: rpn
            }];

            // Only update the work item if the RPN has changed
            if (rpn != workItem.fields[storedFields.rpnField]) {
                client.updateWorkItem(document, workItemId).then((updatedWorkItem:TFS_Wit_Contracts.WorkItem) => {
                    deferred.resolve(updatedWorkItem);
                });
            }
            else {
                deferred.reject("No relevant change to work item");
            }
        }
        else
        {
            deferred.reject("Unable to calculate RPN, please configure fields on the collection settings page.");
        }
    });

    return deferred.promise;
}

var formObserver = (context) => {
    return {
        onFieldChanged: function(args) {
            GetStoredFields().then((storedFields:StoredFieldReferences) => {
                if (storedFields && storedFields.svField && storedFields.usersField && storedFields.ocField && storedFields.dtField && storedFields.rpnField) {
                    //If one of fields in the calculation changes
                    if ((args.changedFields[storedFields.svField] !== undefined) || 
                        (args.changedFields[storedFields.ocField] !== undefined) ||
                        (args.changedFields[storedFields.dtField] !== undefined) ||
                        (args.changedFields[storedFields.usersField] !== undefined)) {
                            updateRPNOnForm(storedFields);
                        }
                }
                else {
                    console.log("Unable to calculate RPN, please configure fields on the collection settings page.");    
                }
            }, (reason) => {
                console.log(reason);
            });
        },
        
        onLoaded: function(args) {
            GetStoredFields().then((storedFields:StoredFieldReferences) => {
                if (storedFields && storedFields.svField && storedFields.usersField && storedFields.ocField && storedFields.dtField && storedFields.rpnField) {
                    updateRPNOnForm(storedFields);
                }
                else {
                    console.log("Unable to calculate RPN, please configure fields on the collection settings page.");
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
                if (storedFields && storedFields.svField && storedFields.usersField && storedFields.ocField && storedFields.dtField && storedFields.rpnField) {
                    var workItemIds = args.workItemIds;
                    var promises = [];
                    $.each(workItemIds, function(index, workItemId) {
                        promises.push(updateRPNOnGrid(workItemId, storedFields));
                    });

                    // Refresh view
                    Q.all(promises).then(() => {
                        VSS.getService(VSS.ServiceIds.Navigation).then((navigationService: IHostNavigationService) => {
                            navigationService.reload();
                        });
                    });
                }
                else {
                    console.log("Unable to calculate RPN, please configure fields on the collection settings page.");
                    //TODO: Disable context menu item
                }
            }, (reason) => {
                console.log(reason);
            });
        }
    };
}

let extensionContext = VSS.getExtensionContext();
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.rpn-work-item-form-observer`, formObserver);
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.rpn-contextMenu`, contextProvider);