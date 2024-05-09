## Copy field transformation matrix

Copying field data directly from one field to another can be done directly with the source and destination field types metioned in the below table

When we copy certain field types, a transformation is made to the data to make it compatible with the destination field type.

Copying a field will overwrite any data in the destination field, it will not preserve or respect any data that currently exists or has been manually entered. The destination field also needs to exist in the Content Type we are targeting.

Finer grained control of the field data transformation (including field types not supported directly) can be made using a [template](copy_field_templates.md)

| source                       | destination                  | notes                                                                                 |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| string                       | string                       |                                                                                       |
|                              | stringArray                  |                                                                                       |
|                              | canvas                       | Content is surrounded within a paragraph block (template can alter the source value)  |
|                              | richText                     |                                                                                       |
|                              | richTextArray                |                                                                                       |
|                              | boolean                      | True if evaluates "truthy" (0, false or null would be false)                          |
| stringArray                  | stringArray                  |                                                                                       |
|                              | string                       | Multiples separated with newline                                                      |
|                              | canvas                       | ^                                                                                     |
|                              | richText                     | ^                                                                                     |
|                              | richTextArray                |                                                                                       |
| richText                     | canvas                       |                                                                                       |
|                              | richText                     |                                                                                       |
|                              | richTextArray                |                                                                                       |
|                              | string                       |                                                                                       |
|                              | stringArray                  |                                                                                       |
| richTextArray                | richTextArray                |                                                                                       |
|                              | richText                     | Multiples separated with newline                                                      |
|                              | canvas                       |                                                                                       |
| boolean                      | boolean                      |                                                                                       |
|                              | string                       | "Yes" or "No"                                                                         |
|                              | stringArray                  | ^                                                                                     |
|                              | integer                      | True = 1, false = 0                                                                   |
|                              | integerArray                 | ^                                                                                     |
|                              | decimal                      | True = 1, false = 0                                                                   |
|                              | decimalArray                 | ^                                                                                     |
| integer                      | integer                      |                                                                                       |
|                              | integerArray                 |                                                                                       |
|                              | decimal                      |                                                                                       |
|                              | decimalArray                 |                                                                                       |
|                              | boolean                      | True if evaluates "truthy" (0, false or null would be false)                          |
| decimal                      | decimal                      |                                                                                       |
|                              | decimalArray                 |                                                                                       |
|                              | integer                      | Truncate any decimal precision (e.g. 44.9 = 44)                                       |
|                              | integerArray                 | ^                                                                                     |
|                              | boolean                      | True if evaluates "truthy" (0, false or null would be false)                          |
| dateTime                     | dateTime                     |                                                                                       |
|                              | dateTimeArray                |                                                                                       |
| image                        | image                        |                                                                                       |
|                              | imageArray                   |                                                                                       |
| imageArray                   | imageArray                   |                                                                                       |
|                              | image                        |                                                                                       |
| component                    | component                    | Source and destination component must contain the same fields                         |
|                              | componentArray               | ^                                                                                     |
| component.\<field type>      | \<field type>                | Supports the field types mentioned above                                              |
| componentArray.\<field type> | \<field type>                | ^ at the first position in the array                                                  |
| \<field type>                | component.\<field type>      | Adds the field to existing component object or add new component with just this field |
|                              | componentArray.\<field type> | ^ at the first position in the array                                                  |
| composer                     | canvas                | Renders composer content as simple HTML and parses to canvas JSON                          |
| \<field type>                | composer                     | Not supported                                                                         |
| canvas                       | \<field type>                | Not supported                                                                         |

Key: ^ = as above
