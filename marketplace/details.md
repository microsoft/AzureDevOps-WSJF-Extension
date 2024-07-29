# WSJF (Weighted Shortest Job First)

 The [Scaled Agile Framework](http://www.scaledagileframework.com) defines [WSJF (Weighted Shortest Job First)](http://www.scaledagileframework.com/wsjf/) as a calculation of cost of delay vs. job size which can help teams prioritize their portfolio backlogs with the items contributing the highest ROI.

# Documentation

###  THe valuesused to calculate WSJF
- Business Value**
- Time Criticality** 
- Risk Reduction | Opportunity Enablement
- Job Size

1. Create Fields

- The first thing you need is to create the fields that will store the RR-OE and WSJF values. Create a custom decimal field through the process hub and add it to the work items you want to display WSJF data on.

![WSJF displaying on the work item form](marketplace/WSJF-Field.png)

2. Configure WSJF 

- Navigate to the "WSJF" hub in the organisation settings. From here, you must specify the fields that will be used for Business Value, Time Criticality, Job Size and WSJF.  The first three are defaulted to the fields provided out of the box by Microsoft but can be changed to custom fields if you prefer.

[WSJF Create fields](marketplace/WSJF-Setting.png)

3. Auto calculated WSJF field on the form

- WSJF is automatically updated when form is loaded.
- WSJF is automatically updated when the Business Value, Time Criticality, Effort,   or Risk Reduction fields are updated.

![WSJF is automatically updated on the work item form](marketplace/AutoCalcWSJF.gif)

4. Recalculate WSJF context menu item
- Update WSJF for all selected work items on the backlog or query grid.

![Recalculate WSJF on the backlog](marketplace/RecalculateWSJF.gif)

*NOTE: If you're using TFS onprem, you need to use witadmin to [Create a custom decimal field](https://www.visualstudio.com/en-us/docs/work/customize/add-modify-field#to-add-a-custom-field)*

## Adding RROE and WSJF Score Values (For TFS)

Export your WorkItem.XML file (ie. Epic.XML) using [WITAdmin](https://docs.microsoft.com/en-us/Azure DevOps/work/customize/reference/witadmin/witadmin-import-export-manage-wits?view=tfs-2018)
At the bottom of your "Fields" section add the following (Name and reference names may vary):

```bash
  <FIELD name="WSJF Risk-Reduction Opportunity-Enablement" refname="WSJF.RROEValue" type="Integer" reportable="dimension">
   <HELPTEXT>WSJF Risk-Reduction</HELPTEXT>
 </FIELD>
 
 <FIELD name="WSJF Score" refname="WSJF.Score" type="Double" reportable="dimension">
   <HELPTEXT>WSJF Score</HELPTEXT>
 </FIELD> 
 ```
 3. Under your <Form> and <WebLayout> tags, choose where you would like the WSJF calculation to go and add:

 ```bash
 <Section>
		   <Group Label="WSJF">
              <Control Label="User-Business Value" Type="FieldControl" FieldName="Microsoft.Azure DevOps.Common.BusinessValue" EmptyText="[Numbered Value]" />
              <Control Label="Urgency/Time Criticality" Type="FieldControl" FieldName="Microsoft.Azure DevOps.Common.TimeCriticality" EmptyText="[Numbered Value]" />
              <Control Label="Risk Reduction/Opportunity Enablement" Type="FieldControl" FieldName="WSJF.RROEValue" EmptyText="[Numbered Value]" />
			           <Control Label="Size" Type="FieldControl" FieldName="Microsoft.Azure DevOps.Scheduling.Effort" EmptyText="[Numbered Value]" />
              <Control Label="WSJF Score" Type="FieldControl" FieldName="WSJF.Score" EmptyText="[Numbered Value]" />
     </Group>
</Section>
```
- After this is done, open up your WSJF tab and adjust your settings
![WSJF_Settings](marketplace/WSJF_Settings.png)

## Support

## How to file issues and get help

This project uses [GitHub Issues](https://marketplace.visualstudio.com/items?itemName=MS-Agile-SAFe.WSJF-extension) to track bugs and feature requests. Please search the existing issues before filing new issues to avoid duplicates. For new issues, file your bug or feature request as a new Issue. 

## Microsoft Support Policy

Support for this project is limited to the resources listed above.