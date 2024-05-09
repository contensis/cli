## Apply a template

If your field type is not supported in the [copy field transformation matrix](copy_field_transformation_matrix.md), or you wish to modify the output value for the field we can supply a [LiquidJS](https://liquidjs.com/tutorials/intro-to-liquid.html) template where we can make use of "tags" and "filters" available in LiquidJS to perform custom transformations on our entry field data

The result after parsing this template will become the new value for the destination field for every entry

Templates allow us to to make some very precise adjustments to the field value we will update

A number of variables are available to use in the liquid template

- `value` - the value of the source field in the entry
- `existing_value` - any existing value of the target field in the entry
- `target_value` - the value that has been prepared to go into the destination field
- `entry` - the entire entry object (if we need to reference another field in the entry)
- `field` - the content type configuration of the source field
- `target_field` - the content type configuration of the target field

### Examples

These are simple examples of using and chaining [LiquidJS filters](https://liquidjs.com/filters/overview.html)

- `"{{ value | capitalize }}"` will capitalise the first letter of the value
- `"{{ value | downcase }}"` will lowercase the entire value
- `"{{ value | downcase | capitalize }}"` will lowercase the entire value then capitalise the first letter
- `"{{ value >= 50 }}"` using logic based on a source field value we can set a boolean to true or false

Use of [LiquidJS tags](https://liquidjs.com/tags/overview.html) is also available for more complex scenarios

### Apply the template before any field transformation

Templates are parsed and rendered after field transformations have taken place and the resulting value is set on the entry as our new field's value.

A special variable is available called `source_value` (which is the same as `value`) except when used, the template is parsed and rendered *prior* to any field transformations taking place. 

The result of this template when parsed will override the source field's value from each entry and this will be transformed again to the target field's type before the resulting value is set on the entry as our target field's value.

This is necessary if you wish to alter the source field value prior to any internal transformations (e.g. before we convert the value to a canvas field).

Using `source_value` means `target_value` and `value` variables are not available.

#### Examples

- `"<h1>{{ source_value }}</h1>"` allows us to surround our `source_value` with some text before it is converted into the destination field type (e.g. canvas)
- `"{{ source_value | remove: ".aspx" }}"` will remove any instance of `.aspx` from our source value

### Transform Composer content with a template

Because of the near infinite flexibility provided by Composer field configurations, in order to transform parts of, or the entire contents of a Composer field in an entry to another field type (except canvas which is now supported by default), we can do this by writing our own template to configure how each item in the Composer is to be "rendered" before adding the transformation result to our destination entry field.

#### Examples

If we have the following Composer content in JSON containing a number of different data types or "Composer items":

```JSON
[
  {
    "type": "text",
    "value": "This is my plain text"
  },
  {
    "type": "markup",
    "value": "<p>This is rich <em>text</em> with some <strong>styling</strong></p>"
  },
  {
    "type": "quote",
    "value": {
      "source": "This is the source",
      "text": "This is a quote"
    }
  },
  {
    "type": "number",
    "value": 123456789
  },
  {
    "type": "boolean",
    "value": false
  },
  {
    "type": "location",
    "value": {
      "lat": 51.584151,
      "lon": -2.997664
    }
  },
  {
    "type": "list",
    "value": [
      "Plum",
      "Orange",
      "Banana"
    ]
  },
  {
    "type": "iconWithText",
    "value": {
      "icon": {
        "sys": {
          "id": "51639de0-a1e4-4352-b166-17f86e3558bf"
        }
      },
      "text": "This is my icon text"
    }
  },
  {
    "type": "asset",
    "value": {
      "sys": {
        "id": "e798df96-1de3-4b08-a270-3787b902a580"
      }
    }
  },
  {
    "type": "image",
    "value": {
      "altText": "A photo of Richard Saunders.",
      "asset": {
        "sys": {
          "id": "bc6435eb-c2e3-4cef-801f-b6061f9cdad6"
        }
      }
    }
  }
]
```

We could supply a template to pull out specific item types into our destination field

The example below will take the list field above and allow the content to be copied into any string type field

```handlebars
{% # use a "for" tag to iterate over our "value" variable (composer field) %}
{% for c_item in value %}
  {% # use an "if" tag to match a composer item type of list in the composer array %}
  {% if c_item.type == 'list' %}
    {% # render any list from the composer field, use a "join" filter to convert the value array to a string %}
    {{ c_item.value | join: ', ' }}
  {% # close the "if" tag %}
  {% endif %}
{% # close the "for" tag %}
{% endfor %}
```

A short hand example similar to the above using only LiquidJS filters

Taking the `value` (a composer item array), filtering just the composer item types of 'list', mapping just the 'value' taking the `first` found 'list' and concatenating the values into a comma-separated string.

```handlebars
{{ value | where: 'type', 'list' | map: 'value' | first | join: ', '  }}
```

So a composer field containing this JSON

```JSON
  [{
    "type": "list",
    "value": [
      "Plum",
      "Orange",
      "Banana"
    ]
  }]
```

becomes `Plum, Orange, Banana`

Or render the same list field data ready to copy into a Rich text or Canvas field, we are free to decorate any value with required markup so it is presented and transformed correctly.

```handlebars
{% for c_item in source_value %} {% if c_item.type == 'list' %}
<ul>
  {% for l_item in c_item.value %}
  <li>{{l_item}}</li>
  {% endfor %}
</ul>
{% endif %} {% endfor %}
```

### Transforming Composer content to Canvas

To transform the above Composer content into a Canvas field, we would need to "render" each item in the Composer that we require in the Canvas field as a very simple HTML representation, and this becomes the value we pass to the HTML parser that in turn renders the JSON that allows us to store the Canvas content in Contensis.

The same kind of theory can be applied to any source field we wish to convert to Canvas content

We must use the `source_value` variable in the template instead of `value` variable as the template needs to alter the source value and be applied _before_ the process transforms the value into Canvas

If the source field (or composer item value) is already a rich text field containing existing markup, we don't need to do any special rendering before this is parsed and converted to Canvas content

```handlebars
{% for c_item in source_value %}
  {% if c_item.type == 'markup' %}{{ c_item.value }}
  {% elsif c_item.type == 'quote' %}
    <p>{{ c_item.value.source }}</p>
    <blockquote>{{ c_item.value.text }}</blockquote>
  {% elsif c_item.type == 'image' %}
    <img src='{{ c_item.value.asset.sys.uri }}' alt='{{ c_item.value.altText }}'/>
  {% else %}<p>{{ c_item.value | join: '</p><p>' | json }}</p>
  {% endif %}
{% endfor %}
```

### Embedding Component data in Canvas

We can curate and store Component data inline with Canvas content in the Contensis editor.

Component data will likely be encountered as part of a parent composer field when converting long-form composer-curated content to Canvas.

Following on from the examples above, we have a component in the composer data of type `iconWithText`. We need to also know the api id of the component (which can be found in the composer field definition in the Content type editor), as the component api id is often different from how it is named in the composer field.

```handlebars
{% for c_item in source_value %}
  {% # ... %}
  {% elsif c_item.type == 'iconWithText' %}
    {{ c_item.value | canvas_component: 'iconWithText' }}
  {% # ... %}
  {% endif %}
{% endfor %}
```

In the above template when we encounter a composer item with a type of `iconWithText` we can render it and apply the custom filter `canvas_component` to the composer item value, supplying the component api id as an argument to this filter

Rendering the component with the custom filter will produce an output that will allow the component (and its content) to be parsed and stored inline in Canvas field content:

```
<div class='component' data-component='iconWithText' data-component-value='{&quot;icon&quot;:{&quot;sys&quot;:{&quot;id&quot;:&quot;51639de0-a1e4-4352-b166-17f86e3558bf&quot;,&quot;dataFormat&quot;:&quot;entry&quot;,&quot;contentTypeId&quot;:&quot;icon&quot;}},&quot;text&quot;:&quot;This is my icon text&quot;}'></div>
```

#### Further component customisation

If you need to customise the component output for the canvas content any further, you can instead not use the suggested custom filter and render the component data as markup following the example output above.

```handlebars
{% for c_item in source_value %}
  {% # ... %}
  {% elsif c_item.type == 'iconWithText' %}
<div class='component' data-component='iconWithText' data-component-value='{{ c_item.value | html_encode }}'></div>
  {% # ... %}
  {% endif %}
{% endfor %}
```

Another custom filter `html_encode` used here is provided to help render the `data-component-value` attribute with the correct encoding to be parsed and embedded into the canvas content

#### Curate redundant components as canvas

If it is preferred for any reason, instead of embedding component data inline in the canvas content, you could stop using the component field and have the content curated, stored and rendered from regular canvas content blocks going forward.

You would use a template to render the data from each component field wrapped in simple appropriate markup so it will be represented like this within canvas content blocks in Contensis after the field data has been copied and converted to canvas.

### Embedding Entry (and asset) links in Canvas

Continuing the example above, we can embed an inline entry link from every matched composer item easily into the canvas content by applying custom filter `canvas_entry`

```handlebars
{% for c_item in source_value %}
  {% # ... %}
  {% elsif c_item.type == 'entry' %}
    {{ c_item.value | canvas_entry }}
  {% # ... %}
  {% endif %}
{% endfor %}
```

Produces output similar to the HTML below which can be parsed and saved inside the canvas content

```
<a class='inline-entry' data-entry='{&quot;sys&quot;:{&quot;id&quot;:&quot;eee9129e-70fc-4f70-b641-01e160af2438&quot;,&quot;dataFormat&quot;:&quot;entry&quot;,&quot;contentTypeId&quot;:&quot;person&quot;}}'></a>
```

Another example of embedding an entry link into canvas where we could be converting existing rich text content to canvas and need to link/append a certain entry at the bottom of every entry's canvas content.

```handlebars
{{ source_value }}
{{ entry.tsAndCs | canvas_entry }}
```

If we need to hard code a specific entry id into the canvas after a rich text field:

```handlebars
{{ source_value }}
{% capture link_entry %}
{ "sys": { "id": "eee9129e-70fc-4f70-b641-01e160af2438", "contentTypeId": "person" } }
{% endcapture %}
{{ link_entry | from_json | canvas_entry }}
```

In the final output we are applying two custom filters to our `link_entry`, `from_json` allows us to use a `capture` tag and hardcode our own json, then parse this as a json object that can be read normally within the template (something which cannot be done natively in LiquidJS).

Further applying `canvas_entry` filter will convert our parsed JSON object into the markup that is valid for loading with canvas content

```handlebars
{{ source_value }}
{{ '{ "sys": { "id": "eee9129e-70fc-4f70-b641-01e160af2438", "contentTypeId": "person" } }' | from_json | canvas_entry }}
```

We can achieve the same effect by applying the filter chain to a hardcoded valid JSON string

### Embedding Images in Canvas

Continuing with the composer example above, we can embed an existing image into the canvas content by applying custom filter `canvas_image`

We also need to ensure we have supplied the option to query the delivery api, as entries returned in the management api search do not contain the image uri in any image fields as the delivery api does.

```handlebars
{% for c_item in source_value %}
  {% # ... %}
  {% elsif c_item.type == 'image' %}
    {{ c_item.value | canvas_image }}
  {% # ... %}
  {% endif %}
{% endfor %}
```

Produces output similar to the HTML below which can be parsed and saved inside the canvas content

```
<img src='/image-library/people-images/richard-saunders-blog-image.x67b5a698.png' altText='A photo of Richard Saunders.'/>
```

Images from existing, external or hardcoded content can be added to the canvas by rendering the image details out into valid markup including an `<img />` tag with a completed `src=""` attribute

### Complete composer example


```handlebars
{% for c_item in source_value %}
  {% if c_item.type == 'markup' %}{{ c_item.value }}
  {% elsif c_item.type == 'quote' %}
    <p>{{ c_item.value.source }}</p>
    <blockquote>{{ c_item.value.text }}</blockquote>
  {% elsif c_item.type == 'iconWithText' %}{{ c_item.value | canvas_component: 'iconWithText' }}
  {% elsif c_item.type == 'image' %}{{ c_item.value | canvas_image }}
  {% elsif c_item.type == 'asset' or c_item.type == 'entry' %}{{ c_item.value | canvas_entry }}
  {% elsif c_item.type == 'boolean' and c_item.value %}Boolean: Yes
  {% else %}<p>{{ c_item.value | join: '</p><p>' | json }}</p>
  {% endif %}
{% endfor %}
```

### Concatenate multiple entry fields

We can utilise a LiquidJS template to concatenate multiple field values together and copy to a destination field

In the example below we will copy the value of the source field to the destination field but also append any existing value if it exists

```handlebars
{{value}}{% if existing_value %} - {{existing_value}}{% endif %}
```

Or we can refer to other fields in the `entry` variable

```handlebars
{{entry.text}}{% if entry.heading %} - {{entry.heading}}{% endif %}
```
