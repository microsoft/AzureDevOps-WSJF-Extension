import Q = require("q");

import TFS_Wit_Contracts = require("TFS/WorkItemTracking/Contracts");
import TFS_Wit_Client = require("TFS/WorkItemTracking/RestClient");
import TFS_Wit_Services = require("TFS/WorkItemTracking/Services");

import { StoredFieldReferences } from "./wsjfModels";
 
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

function updateWSJFOnForm(storedFields:StoredFieldReferences) {
    getWorkItemFormService().then((service) => {
        service.getFields().then((fields: TFS_Wit_Contracts.WorkItemField[]) => {
            var matchingBusinessValueFields = fields.filter(field => field.referenceName === storedFields.bvField);
            var matchingTimeCriticalityFields = fields.filter(field => field.referenceName === storedFields.tcField);
            var matchingRROEValueFields = fields.filter(field => field.referenceName === storedFields.rvField);
            var matchingEffortFields = fields.filter(field => field.referenceName === storedFields.effortField); 
            var matchingWSJFFields = fields.filter(field => field.referenceName === storedFields.wsjfField);
            var roundTo: number = storedFields.roundTo;



console.log("M == Business Value: ", matchingBusinessValueFields);
console.log("M ==Time Criticality: "  ,matchingTimeCriticalityFields);
console.log("M == RROE Value: " , matchingRROEValueFields);
console.log("M == Effort: ",  matchingEffortFields);
console.log("M == WSJF: " ,matchingWSJFFields);

            //If this work item type has WSJF, then update WSJF
        
                service.getFieldValues([storedFields.bvField, storedFields.tcField, storedFields.rvField, storedFields.effortField]).then((values) => {

                    console.log("Business Value: " +values[storedFields.bvField]);
                    console.log("Time Criticality: "+values[storedFields.tcField]);
                    console.log("RROE Value: "  +values[storedFields.tcField]);
                    console.log("Effort: " +values[storedFields.effortField]);



                    var businessValue  = values[storedFields.bvField] !== undefined || NaN? Number(values[storedFields.bvField]) : 0;
                    var timeCriticality = values[storedFields.tcField] !== undefined || NaN ? Number(values[storedFields.tcField]) : 0;
                    var rroevalue = values[storedFields.rvField] !== undefined || NaN ? Number(values[storedFields.rvField]) : 0;
                    var effort = values[storedFields.effortField] !== undefined || NaN ? Number(values[storedFields.effortField]) : 0;

                    // var businessValue  = +values[storedFields.bvField]
                    // var timeCriticality = +values[storedFields.tcField] 
                    // var rroevalue = +values[storedFields.rvField] 
                    // var effort = +values[storedFields.effortField] 
                 
               

                    var wsjf = 0;
                    if (effort > 0) {
                        wsjf = (businessValue + timeCriticality + rroevalue)/effort;
                        if(roundTo > -1) {
                            wsjf = Math.round(wsjf * Math.pow(10, roundTo)) / Math.pow(10, roundTo)
                        }
                    }
                    
                    service.setFieldValue(storedFields.wsjfField, wsjf);
                });
            
        });
    });
}

function updateWSJFOnGrid(workItemId, storedFields:StoredFieldReferences):IPromise<any> {
    let wsjfFields = [
        storedFields.bvField,
        storedFields.tcField,
        storedFields.rvField,
        storedFields.effortField,
        storedFields.wsjfField
    ];

    var deferred = Q.defer();

    var client = TFS_Wit_Client.getClient();
    client.getWorkItem(workItemId, wsjfFields).then((workItem: TFS_Wit_Contracts.WorkItem) => {
        if (storedFields.wsjfField !== undefined && storedFields.rvField !== undefined) {     
            
            var businessValue = Number(workItem.fields[storedFields.bvField]) || 0
            
            var timeCriticality = Number(workItem.fields[storedFields.tcField]) || 0
            
            var rroevalue = Number(workItem.fields [storedFields.rvField]) || 0
            
            var effort = Number(workItem.fields[storedFields.effortField]) || 0
            var roundTo: number = storedFields.roundTo;


                  
            // var businessValue = +workItem.fields[storedFields.bvField] 
            
            // var timeCriticality = +workItem.fields[storedFields.tcField] 
            
            // var rroevalue = +workItem.fields [storedFields.rvField]
            // var effort = +workItem.fields[storedFields.effortField] 
            // var roundTo: number = storedFields.roundTo;


            // console.log("Business Value: " + businessValue);
            // console.log("Time Criticality: " + timeCriticality);
            // console.log("RROE Value: " + rroevalue);
            // console.log("Effort: " + effort);
     

            var wsjf = 0;
            if (effort > 0) {
                wsjf = (businessValue + timeCriticality + rroevalue)/effort;
                if(roundTo > -1) {
            wsjf = Math.round(wsjf * Math.pow(10, roundTo)) / Math.pow(10, roundTo)
                }
            }

            console.log("WSJF: " + wsjf);
            var document = [{
                from: null,
                op: "add",
                path: '/fields/' + storedFields.wsjfField,
                value: wsjf
            }];

            // Only update the work item if the WSJF has changed
            if (wsjf != workItem.fields[storedFields.wsjfField]) {
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
            deferred.reject("Unable to calculate WSJF, please configure fields on the collection settings page.");
        }
    });

    return deferred.promise;
}

var formObserver = (context) => {
    return {
        onFieldChanged: function(args) {
            GetStoredFields().then((storedFields:StoredFieldReferences) => {
                if (storedFields && storedFields.bvField && storedFields.effortField && storedFields.tcField && storedFields.rvField && storedFields.wsjfField) {
                    //If one of fields in the calculation changes
                    if ((args.changedFields[storedFields.bvField] !== undefined) || 
                        (args.changedFields[storedFields.tcField] !== undefined) ||
                        (args.changedFields[storedFields.rvField] !== undefined) ||
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
                if (storedFields && storedFields.bvField && storedFields.effortField && storedFields.tcField && storedFields.rvField && storedFields.wsjfField) {
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
                if (storedFields && storedFields.bvField && storedFields.effortField && storedFields.tcField && storedFields.rvField && storedFields.wsjfField) {
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