Generic Data Binder v1.0 [<img src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif">](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=john@johnlouderback.com&lc=US&item_name=Generic%20Data%20Binder&currency_code=USD&bn=PP-DonationsBF:btn_donate_LG.gif:NonHosted)
===
##About GDB
Generic Data Binder (GDB) for jQuery is a framework agnostic and extremely easy to use 2 way data binder. GDB binds views and models in realtime with live two-way binding and no hefty framework necessary.

##Why Use GDB?
GDB is a simple to use, zero configuration (unless you want to), template engine and framework agnostic little plugin. Drop it in and initialize it. It just works. Updates to the model automagically update the view and changes in the view automagically update the model.
Finally, a plugin that allows for bi-directional live bindings between your view and model without the need to learn a hefty framework or change your current work flow.

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
Property | Type | Default Value | Description
---------|------|---------------|------------
rootElementSelectorString | string | ``"body"`` | This property specifies what the root element is for whose children are monitored for changes and should be updated in realtime. Default is the body element, but specifying another element may be useful if using multiple instances of GDB for multiple templates.
realtime | boolean | ``true`` | This property specifies whether or not to update the model with changes as the user makes them. Such as: if the user is typing into an input, textarea, or contenteditable field the model will be updated with everything key press and alteration. If this value is set to ``false`` then the model will only be updated when the bound field loses focus.
dataBindToAttr | string | ``"data-bindto"`` | This property specifies the name of the attribute which contains the mapping to the location in the model to which a given element's data is bound. Changing this property's value may be useful in the event that there is a conflict with using the ``data-bindto`` attribute.
bindAsTextOnly | boolean | ``false`` | This property specifies whether to use content of contenteditable elements as HTML or get the plain text.
debugLogging | boolean | ``false`` | When is property is set to ``true``, changes made to the model or view are recorded in the console via the console.log() function.
modelChangeCallback | function or null | ``null`` | This property may be set to a callback function which is fired when the model has been changed. This function is currently passed no arguments.

All User Options are entirely optional.

##Browser Support
Tested in Firefox, Chrome, and IE. Works in IE 8+.

##TODO
- [ ] Add simple templating functionality
- [ ] Add ability to add data parsing functions
- [ ] Add more and better examples
- [ ] Create pure JavaScript version if there is an interest
- [x] Upload initial stable release
- [x] Upload initial beta version

##Changelog
- v1.0 - 3/29/2014 - Initial Stable Release. Fixed several minor bugs and added new callback function.
- v0.8 - 3/23/2014 - Uploaded initial version.
