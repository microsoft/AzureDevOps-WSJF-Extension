# WSJF (Weighted Shortest Job First)

Weighted Shortest Job First (WSJF) is a prioritization technique used in the Scaled Agile Framework (SAFe) to sequence work items based on their economic impact and size. It calculates the Cost of Delay (considering user value, time criticality, and risk reduction/opportunity enablement) divided by the job size to determine priority. WSJF helps teams maximize ROI by ensuring the most valuable tasks are tackled first, fostering efficient resource allocation and decision-making in agile environments.

# Documentation

The [Scaled Agile Framework](http://www.scaledagileframework.com) defines [WSJF (Weighted Shortest Job First)](http://www.scaledagileframework.com/wsjf/) as a calculation of cost of delay vs. job size which can help teams prioritize their portfolio backlogs with the items contributing the highest ROI.

![WSJF = Business Value + Time Criticality + Risk Reduction | Opportunity Enablement /Effort](marketplace/WSJF-used-values.png)

### The values used to calculate WSJF

- Business Value
- Time Criticality
- Risk Reduction | Opportunity Enablement
- Job Size (Effort)

### The steps below shows how to configure and use the WSJF extension

1. Create Fields

- The first thing you need is to create the fields that will store the RR-OE and WSJF values. Create a custom decimal field through the process hub and add it to the work items you want to display WSJF data on.
![Create a custom decimal field](marketplace/WSJF-create-fields.png)

2. Configure WSJF

- Navigate to the "WSJF" hub in the organisation settings. From here, you must specify the fields that will be used for Business Value, Time Criticality, Job Size and WSJF. The first three are defaulted to the fields provided out of the box by Microsoft but can be changed to custom fields if you prefer.
![WSJF displaying on the work item form](marketplace/WSJF-Setting.png)

3. Auto calculated WSJF field on the form

- WSJF is automatically updated when the form is loaded.
- WSJF is automatically updated when the Business Value, Time Criticality, Effort, or Risk Reduction fields are updated.
![WSJF is automatically updated on the work item form](marketplace/AutoCalcWSJF.gif)

4. Recalculate WSJF context menu item

- Update WSJF for all selected work items on the backlog or query grid.
![Recalculate WSJF on the backlog](marketplace/RecalculateWSJF.gif)

_NOTE: If you're using Azure DevOps Server, you need to use witadmin to [Create a custom decimal field](https://www.visualstudio.com/en-us/docs/work/customize/add-modify-field#to-add-a-custom-field)_

## Adding RROE and WSJF Score Values (For Azure DevOps Server)

Export your WorkItem.XML file (ie. Epic.XML) using [WITAdmin](https://learn.microsoft.com/en-us/previous-versions/azure/devops/reference/witadmin/witadmin-import-export-manage-wits?view=tfs-2018)
At the bottom of your "Fields" section add the following (Name and reference names may vary):

```xml
 <FIELD name="WSJF Risk-Reduction Opportunity-Enablement" 
       refname="WSJF.RROEValue" 
       type="Integer" 
       reportable="dimension">
  <HELPTEXT>WSJF Risk-Reduction</HELPTEXT>
</FIELD>
<FIELD name="WSJF Score" 
       refname="WSJF.Score" 
       type="Double" 
       reportable="dimension">
  <HELPTEXT>WSJF Score</HELPTEXT>
</FIELD>
```

3.  Under your `<Form>` and `<WebLayout>` tags, choose where you would like the WSJF calculation to go and add:

```xml
 <Section>
  <Group Label="WSJF">
    <Control Label="User-Business Value" 
             Type="FieldControl" 
             FieldName="Microsoft.Azure DevOps.Common.BusinessValue" 
             EmptyText="[Numbered Value]" />
    <Control Label="Urgency/Time Criticality" 
             Type="FieldControl" 
             FieldName="Microsoft.Azure DevOps.Common.TimeCriticality" 
             EmptyText="[Numbered Value]" />
    <Control Label="Risk Reduction/Opportunity Enablement" 
             Type="FieldControl" 
             FieldName="WSJF.RROEValue" 
             EmptyText="[Numbered Value]" />
    <Control Label="Size" 
             Type="FieldControl" 
             FieldName="Microsoft.Azure DevOps.Scheduling.Effort" 
             EmptyText="[Numbered Value]" />
    <Control Label="WSJF Score" 
             Type="FieldControl" 
             FieldName="WSJF.Score" 
             EmptyText="[Numbered Value]" />
  </Group>
</Section>

```

- After this is done, open up your WSJF tab and adjust your settings
  ![WSJF_Settings](marketplace/WSJF_Settings.png)

## Support

## How to file issues and get help

This project uses [GitHub Issuess](https://github.com/microsoft/AzureDevOps-WSJF-Extension/issues) to track bugs and feature requests. Please search the existing issues before filing new issues to avoid duplicates. For new issues, file your bug or feature request as a new Issue.

## Microsoft Support Policy

Support for this project is limited to the resources listed above.