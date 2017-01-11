WSJF enables a **calculated field** for computing and storing WSJF on your work items.

![WSJF displaying on the work item form](marketplace/WSJF_on_form.png)

The [Scaled Agile Framework](http://www.scaledagileframework.com) defines [WSJF (Weighted Shortest Job First)](http://www.scaledagileframework.com/wsjf/) as a calculation of cost of delay vs. job size which can help teams prioritize their portfolio backlogs with the items contributing the highest ROI.

![WSJF = (Business Value + Time Criticality)/Job Size](http://www.scaledagileframework.com/wp-content/uploads/2014/07/Figure-2.-A-formula-for-calculating-WSJF.png)

Three values are used to calculate  WSJF:
* **Business Value**
* **Time Criticality** 
* **Job Size**

# Setup
1. The first thing you need is to create the field that will store the WSJF values.  [Create a custom decimal field](https://www.visualstudio.com/en-us/docs/work/process/customize-process-field#add-a-custom-field) through the process hub and add it to the work items you want to display WSJF data on.
![WSJF displaying on the work item form](marketplace/CreateField.png)

*NOTE: If you're using TFS onprem, you need to use witadmin to [Create a custom decimal field](https://www.visualstudio.com/en-us/docs/work/customize/add-modify-field#to-add-a-custom-field)*

2. Navigate to the "WSJF" hub on the collection settings admin experience.  From here, you must specify the fields that will be used for Business Value, Time Criticality, Job Size and WSJF.  The first three are defaulted to the fields provided out of the box by Microsoft but can be changed to custom fields if you prefer.
![WSJF displaying on the work item form](marketplace/Settings.png)

# Features
## Auto calculated WSJF field on the form
* WSJF is automatically updated when form is loaded.
* WSJF is automatically updated when the Business Value, Time Criticality, or Effort fields are updated.
![WSJF is automatically updated on the work item form](marketplace/AutoCalcWSJF.gif)

## Recalculate WSJF context menu item
* Update WSJF for all selected work items on the backlog or query grid.
![Recalculate WSJF on the backlog](marketplace/Recalculate.gif)

## Settings hub
* Specify which fields are used for WSJF, Business Value, Time Criticality, and Effort .
![Mapping fields for calculation](marketplace/Settings.gif)

## Support
Because this extension requires the new work item form, it is only supported on VSTS and the next version of TFS (Dev15-RC1).