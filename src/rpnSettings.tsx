import Q = require("q");
import Controls = require("VSS/Controls");
import {Combo, IComboOptions} from "VSS/Controls/Combos";
import Menus = require("VSS/Controls/Menus");
import WIT_Client = require("TFS/WorkItemTracking/RestClient");
import Contracts = require("TFS/WorkItemTracking/Contracts");
import Utils_string = require("VSS/Utils/String");

import { StoredFieldReferences } from "./rpnModels";

export class Settings {
    private _changeMade = false;
    private _selectedFields:StoredFieldReferences;
    private _fields:Contracts.WorkItemField[];
    private _menuBar = null;

    private getSortedFieldsList():IPromise<any> {
        var deferred = Q.defer();
        var client = WIT_Client.getClient();
        client.getFields().then((fields: Contracts.WorkItemField[]) => {
            this._fields = fields.filter(field => (field.type === Contracts.FieldType.Double || field.type === Contracts.FieldType.Integer || field.type === Contracts.FieldType.String))
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
                    case "Severity":
                        that._selectedFields.svField = fieldReferenceName;
                        break;
                    case "Occurence":
                        that._selectedFields.ocField = fieldReferenceName;
                        break;
                    case "Detection":
                        that._selectedFields.dtField = fieldReferenceName;
                    case "UsersAffected":
                        that._selectedFields.usersField = fieldReferenceName;
                        break;
                    case "RPN":
                        that._selectedFields.rpnField = fieldReferenceName;
                        break;
                }
                that.updateSaveButton();
            }
        };
    }

    public initialize() {
        let hubContent = $(".hub-content");
        let uri = VSS.getWebContext().collection.uri + "_admin/_process";
        
        let descriptionText = "RPN is used for quantitatively assessing work items based off of risk.";
        let header = $("<div />").addClass("description-text bowtie").appendTo(hubContent);
        header = $("<div />").addClass("description-text bowtie").appendTo(hubContent);
        header.html(Utils_string.format(descriptionText));

        $("<img src='https://www.fmea-fmeca.com/images/fmea-rpn1.jpg' />").addClass("description-image").appendTo(hubContent);
        
        descriptionText = "must be an integer, or a specific string format for each work item type you wish to compute RPN.";
        header = $("<div />").addClass("description-text bowtie").appendTo(hubContent);
        header.html(Utils_string.format(descriptionText, "<a target='_blank' href='" + uri +"'>process hub</a>"));

        let container = $("<div />").addClass("rpn-settings-container").appendTo(hubContent);

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

        let svContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("Severity Field").appendTo(svContainer);

        let ocContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("Occurence Field").appendTo(ocContainer);

        let dtContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("Detection Values Field").appendTo(dtContainer);

        let usersContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("Users Affected Values Field").appendTo(usersContainer);

        let rpnContainer = $("<div />").addClass("settings-control").appendTo(container);
        $("<label />").text("RPN Field").appendTo(rpnContainer);            

        VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            dataService.getValue<StoredFieldReferences>("storedFields").then((storedFields:StoredFieldReferences) => {
                if (storedFields) {
                    console.log("Retrieved fields from storage");
                    this._selectedFields = storedFields;
                }
                else {
                    console.log("Failed to retrieve fields from storage, defaulting values")
					//Enter in your config referenceName for "dtField" and "rpnField"
                    this._selectedFields = {
                        svField: "Microsoft.VSTS.Common.Severity",
                        ocField: null,
                        dtField: null,
                        usersField: null,
                        rpnField: null
                    };
                }

                this.getSortedFieldsList().then((fieldList) => {
                    Controls.create(Combo, svContainer, this.getComboOptions("Severity", fieldList, this._selectedFields.svField));
                    Controls.create(Combo, ocContainer, this.getComboOptions("Occurence", fieldList, this._selectedFields.ocField));
                    Controls.create(Combo, dtContainer, this.getComboOptions("Detection", fieldList, this._selectedFields.dtField));
                    Controls.create(Combo, usersContainer, this.getComboOptions("UsersAffected", fieldList, this._selectedFields.usersField));
                    Controls.create(Combo, rpnContainer, this.getComboOptions("RPN", fieldList, this._selectedFields.rpnField));
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
        var buttonState = (this._selectedFields.svField && this._selectedFields.ocField && this._selectedFields.dtField &&
                            this._selectedFields.usersField && this._selectedFields.rpnField) && this._changeMade
                            ? Menus.MenuItemState.None : Menus.MenuItemState.Disabled;

        // Update the disabled state
        this._menuBar.updateCommandStates([
            { id: "save", disabled: buttonState },
        ]);
    }
}