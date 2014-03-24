Generic Data Binder v0.8
===
##About GDB
Generic Data Binder for jQuery. Binds views and models in realtime with live two-way binding and no hefty framework necessary.

##Example Useage
###HTML or Template File
```html
<span data-bindto="teacher.name" contenteditable="true" > Ms. Trunchbull </span>
```

Use the "data-bindto" attribute in your templates or static HTML file and map the attribute to the location in the data model where the bound data exists. The format must be such that array indexes are specified in bracket notation (ie. "[0]") and object properties are written in dot notation (ie. ".propertyName"). Specifying object properties in backet notation (ie. "['propertyName']") will not work when the model is updated from within the code and so this is discouraged.
###JavaScript
```javascript
$(function(){ //GDB is only available once jQuery is ready.
  GDB({
    teacher: { 
      name: "Ms. Trunchbull" 
    } 
  }) ;
});
```

The above example shows the most simple implementation. GDB is initialized using the syntax 
```javascript
GDB( objectOfModels, objectOfUserOptions );
```
The first parameter is a JavaScript object literal whose properties are objects representing the data model.
The second parameter is an object containing user specified options.

Using the example above the element bound to the model will update the model in realtime as the data in the element changes. Vice-versa is also true. When data in the data model is changed, the element will update accordingly automatically.

##User Options
All User Options are entirely optional.
Property | Type | Default Value | Description
---------|------|---------------|------------
rootElementSelectorString | string | ``"body"`` | This property specifies what the root element is for whose children are monitored for changes and should be updated in realtime. Default is the body element, but specifying another element may be useful if using multiple instances of GDB for multiple templates.
realtime | boolean | ``true`` | This property specifies whether or not to update the model with changes as the user makes them. Such as: if the user is typing into an input, textarea, or contenteditable field the model will be updated with everything key press and alteration. If this value is set to ``false`` then the model will only be update when the bound field loses focus.
dataBindToAttr | string | ``"data-bindto"`` | This property specifies the name of the attribute which contains the mapping to the location in the model to which a given element's data is bound. Changing this property's value may be useful in the event that there is a conflict with using the ``data-bindto`` attribute.
bindAsTextOnly | boolean | ``false`` | This property specifies whether to use content of contenteditable elements as HTML or get the plain text.
debugLogging | boolean | ``false`` | When is property is set to ``true``, changes made to the model or view are recorded in the console via the console.log() function.
