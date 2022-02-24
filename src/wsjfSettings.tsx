import Q = require("q");
import Controls = require("VSS/Controls");
import {Combo, IComboOptions} from "VSS/Controls/Combos";
import Menus = require("VSS/Controls/Menus");
import WIT_Client = require("TFS/WorkItemTracking/RestClient");
import Contracts = require("TFS/WorkItemTracking/Contracts");
import Utils_string = require("VSS/Utils/String");

import { StoredFieldReferences } from "./wsjfModels";

export class Settings {
    private _changeMade = false;
    private _selectedFields:StoredFieldReferences;
    private _fields:Contracts.WorkItemField[];
    private _menuBar = null;

    private getSortedFieldsList():IPromise<any> {
        var deferred = Q.defer();
        var client = WIT_Client.getClient();
        client.getFields().then((fields: Contracts.WorkItemField[]) => {
            this._fields = fields.filter(field => (field.type === Contracts.FieldType.Double || field.type === Contracts.FieldType.Integer))
            var sortedFields = this._fields.map(field => field.name).sort((field1,field2) => {
                if (field1 > field2) {
                    return 1;
                }

                if (field1 < field2) {
                    return -1;
                }

                return 0;
            });
            deferred.resolve(sortedFields);
        });

        return deferred.promise;
    }

    private getFieldReferenceName(fieldName): string {
        let matchingFields = this._fields.filter(field => field.name === fieldName);
        return (matchingFields.length > 0) ? matchingFields[0].referenceName : null;
    }

    private getFieldName(fieldReferenceName): string {
        let matchingFields = this._fields.filter(field => field.referenceName === fieldReferenceName);
        return (matchingFields.length > 0) ? matchingFields[0].name : null;
    }

    private getComboOptions(id, fieldsList, initialField):IComboOptions {
        var that = this;
        return {
            id: id,
            mode: "drop",
            source: fieldsList,
            enabled: true,
            value: that.getFieldName(initialField),
            change: function () {
                that._changeMade = true;
                let fieldName = this.getText();
                let fieldReferenceName: string = (this.getSelectedIndex() < 0) ? null : that.getFieldReferenceName(fieldName);

                switch (this._id) {
                    case "businessValue":
                        that._selectedFields.bvField = fieldReferenceName;
                        break;
                    case "timeCriticality":
                        that._selectedFields.tcField = fieldReferenceName;
                        break;
                    case "rroevalue":
                        that._selectedFields.rvField = fieldReferenceName;
                        break;
                    case "effort":
                        that._selectedFields.effortField = fieldReferenceName;
                        break;
                    case "wsjf":
                        that._selectedFields.wsjfField = fieldReferenceName;
                        break;
                }
                that.updateSaveButton();
            }
        };
    }

    public initialize() {
        let hubContent = $(".hub-content");
        let uri = VSS.getWebContext().collection.uri + "_admin/_process";
        
        let descriptionText = "{0} is a concept of {1} used for weighing the cost of delay with job size.";
        let header = $("<div />").addClass("description-text bowtie").appendTo(hubContent);
        header = $("<div />").addClass("description-text bowtie").appendTo(hubContent);
        header.html(Utils_string.format(descriptionText));

        $("<img src='https://www.scaledagileframework.com/wp-content/uploads/2014/07/Figure-2.-A-formula-for-calculating-WSJF.png' />").addClass("description-image").appendTo(hubContent);
        
        descriptionText = "You must add a custom decimal field from the {0} to each work item type you wish to compute WSJF.";
        header = $("<div />").addClass("description-text bowtie").appendTo(hubContent);
        header.html(Utils_string.format(descriptionText, "<a target='_blank' href='" + uri +"'>process hub</a>"));

        let container = $("<div />").addClass("wsjf-settings-container").appendTo(hubContent);

        var menubarOptions = {
            items: [
                { id: "save", icon: "icon-save", title: "Save the selected field" }   
            ],
            executeAction:(args) => {
                var command = args.get_commandName();
                switch (command) {
                    case "save":
                        this.save();
                        break;
                    default:
                        console.log("Unhandled action: " + command);
                        break;
                }
            }
        };
        this._menuBar = Controls.create<Menus.MenuBar, any>(Menus.MenuBar, container, menubarOptions);

        let bvContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("Business Value Field").appendTo(bvContainer);

        let tcContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("Time Criticality Field").appendTo(tcContainer);

        let rvContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("RR-OE Values Field").appendTo(rvContainer);

        let effortContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("Effort Field").appendTo(effortContainer);

        let wsjfContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("WSJF Field").appendTo(wsjfContainer);            

        VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            dataService.getValue<StoredFieldReferences>("storedFields").then((storedFields:StoredFieldReferences) => {
                if (storedFields) {
                    console.log("Retrieved fields from storage");
                    this._selectedFields = storedFields;
                }
                else {
                    console.log("Failed to retrieve fields from storage, defaulting values")
					//Enter in your config referenceName for "rvField" and "wsjfField"
                    this._selectedFields = {
                        bvField: "Microsoft.VSTS.Common.BusinessValue",
                        tcField: "Microsoft.VSTS.Common.TimeCriticality",
                        rvField: null,
                        effortField: "Microsoft.VSTS.Scheduling.Effort",
                        wsjfField: null
                    };
                }

                this.getSortedFieldsList().then((fieldList) => {
                    Controls.create(Combo, bvContainer, this.getComboOptions("businessValue", fieldList, this._selectedFields.bvField));
                    Controls.create(Combo, tcContainer, this.getComboOptions("timeCriticality", fieldList, this._selectedFields.tcField));
                    Controls.create(Combo, rvContainer, this.getComboOptions("rroevalue", fieldList, this._selectedFields.rvField));
                    Controls.create(Combo, effortContainer, this.getComboOptions("effort", fieldList, this._selectedFields.effortField));
                    Controls.create(Combo, wsjfContainer, this.getComboOptions("wsjf", fieldList, this._selectedFields.wsjfField));
                    this.updateSaveButton();

                    VSS.notifyLoadSucceeded();
                });
            });
        });  
    }

    private save() {
        VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            dataService.setValue<StoredFieldReferences>("storedFields", this._selectedFields).then((storedFields:StoredFieldReferences) => {
                console.log("Storing fields completed");
                this._changeMade = false;
                this.updateSaveButton();
            });
        });
    } 

    private updateSaveButton() {
        var buttonState = (this._selectedFields.bvField && this._selectedFields.tcField && this._selectedFields.rvField &&
                            this._selectedFields.effortField && this._selectedFields.wsjfField) && this._changeMade
                            ? Menus.MenuItemState.None : Menus.MenuItemState.Disabled;

        // Update the disabled state
        this._menuBar.updateCommandStates([
            { id: "save", disabled: buttonState },
        ]);
    }
}