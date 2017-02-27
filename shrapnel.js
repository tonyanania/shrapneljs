//Copyright (c) 2010 Tony Anania/Daniel Torelli, https://github.com/tonyanania/shrapneljs

//Permission is hereby granted, free of charge, to any person obtaining
//a copy of this software and associated documentation files (the
//"Software"), to deal in the Software without restriction, including
//without limitation the rights to use, copy, modify, merge, publish,
//distribute, sublicense, and/or sell copies of the Software, and to
//permit persons to whom the Software is furnished to do so, subject to
//the following conditions:

//The above copyright notice and this permission notice shall be
//included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
//LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
//WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

//rootID : ID of the binding container
//the_data : Data to bind
//callbackFunction : Function back that serves as a callback when shrapnel is done rendering.
var Shrapnel = function (rootID, the_data, callbackFunction) {

    var isInitialized = true;
    var manager = this;
    var rootElement = document.getElementById(rootID);
    var parentRoot = rootElement.parentNode;
    var initialRoot = rootElement.cloneNode(true);
    //Returns the data to update the 2 way binding.
    //clone object not to affect original.  
    //this.data = eval('(' + JSON.stringify(the_data) + ')'); // good but does not serialize objects(dates, functions)
    //if hidden show.
    this.deepCopy = function (o) {
        var copy = o, k;
        if (o && typeof o === 'object') {
            if (o instanceof Date || o instanceof RegExp)
                copy = new o.constructor(o); //or new Date(obj);
            else
                copy = Object.prototype.toString.call(o) === '[object Array]' ? [] : {};
            for (k in o) {
                copy[k] = this.deepCopy(o[k]);
            }
        }

        return copy;
    };
    this.data = this.deepCopy(the_data); //serializes dates, functions, might be missing some.

    //start bind from parent
    this.bind = function (rootel, data) {
        //var manager = this;

        //BIND attribute the ones on in the element.
        manager.bindToElements(rootel, null, data);

        //LOOP attribute
        //look to see if there is any loop elements
        var loop_elements = rootel.querySelectorAll('[loop]');
        for (var x = 0; x < loop_elements.length; x++) {
            var vvv = loop_elements[x];
            if (closestWithAttribute(vvv.parentElement, 'loop') == null) {
                var key = vvv.getAttribute("loop");

                if (data[key] != undefined && data[key].value.length > 0)
                {
                    //if there is a collection of objects.
                    var latestelement;
                    //clone the loop element for a template.
                    var looptemplate = vvv.cloneNode(true);
                    //console.log(looptemplate);
                    //add new functions, Add / Remove
                    //data[key].value.prototype = Object.getPrototypeOf(data[key].value);
                    //if (data[key].value.Add == undefined) data[key].value.prototype.Add = function (obj) { manager.bind(this.Template, obj); };
                    //if (data[key].value.Remove == undefined) data[key].value.prototype.Remove = function () { console.log('removed'); }
                    //if (data[key].value.Template == undefined) data[key].value.prototype.Template = looptemplate;

                    for (var i = 0; i < data[key].value.length; i++)
                    {
                        var newelement;
                        //if its the first, use the template on the page, else create another loop template to use.
                        if (i == 0)
                            //use the first loop element
                            newelement = vvv;
                        else

                            newelement = looptemplate.cloneNode(true);

                        //remove the loop attribute so the app doesnt pick it up again while going through the elements.
                        newelement.removeAttribute('loop');

                        //bind the loop object to the element.
                        manager.bind(newelement, data[key].value[i]);
                        //if its not the first, create add the new one.                        

                        //if its a template
                        if (i != 0) {
                            vvv.parentNode.insertBefore(newelement, latestelement.nextSibling);
                        }
                        //remember last element to append the next one to.
                        latestelement = newelement;
                    };
                }
            }
        };
    }

    this.bindToElements = function (rootel, parentkey, data) {
        //var manager = this;
        var keys = [];
        //if its a Field object(properties used on the page), else use the data object not converted.
        if (data != null) {
            if (data.constructor == Field)
                keys = Object.keys(data.value);
            else
                keys = Object.keys(data);
        }
        //go through each key in the object
        keys.forEach(function (key) {

            var elements = [];
            var searchkey = '';
            //if there's a parent key, build the searchkey to match it with the property name used in the bind attribute. 
            //Ex: Book.Cover.Type
            //MAKE LESS REPLACE ALL CALLS FOR PERFORMANCE INCREASE.
            if (parentkey != null && parentkey != '') {
                searchkey = replaceAll(parentkey, ':', '\:') + '\\.' + replaceAll(key, ':', '\\:');
            }
            else {
                searchkey = (!isNaN(parseFloat(key)) && isFinite(key)) ? '' : replaceAll(key, ':', '\\:');
            }

            //bind to field class
            //if it's been set, append new elements to it.
            //get the property and replace it with a class that contains the data and the binded elements.
            //if the data is null, still its value.
            if (data[key] == null || (data[key] != undefined && data[key].constructor != Field)) {

                data[key] = new Field(data[key], []);
            }

            //if the property is an object, loop through this ones properties as well.
            if (data[key].value != null && typeof (data[key].value) == 'object' && !(data[key].value instanceof Array)) {

                //keep going lower by building parent key. and keep binding all properties if it is an object.
                //get property value
                manager.bindToElements(rootel, searchkey, data[key].value);
            }
            else if (data[key].value != null && typeof (data[key].value) == 'object' && (data[key].value instanceof Array)) {

                //console.log(key);
            }
                //if its a primitive property
            else {
                //replace {{ }}
                manager.replaceTextProperties(rootel, searchkey, data[key].value);

                //get all elements with key and with a key object with property "."
                var bind_elements = rootel.querySelectorAll(`[bind=${searchkey}]`);
                
                for (var i = 0; i < bind_elements.length; i++) {
                    var vvv = bind_elements[i];
                    
                    //if the property is found within a loop parent, skip.
                    if (closestWithAttribute(vvv, 'loop') == null) {
                        elements.push(vvv);
                        //add the event listener on change.
                        vvv.addEventListener('change', function (e) { manager.onChangeListener(e, data[key]); });
                    }
                };
            }

            for (var y = 0; y < elements.length; y++) {
                //remove bind attribute.
                elements[y].removeAttribute('bind');
                data[key].addElement(elements[y]);
            }
        });
    }
    //removes all listeners. Probably memory leak needs fixing.
    this.destroy = function () {
        //if manager is null, its dead.
        if (manager == null) return;
        //return to previous state.
        parentRoot.replaceChild(initialRoot, rootElement);
        rootElement = null;
        initialRoot = null;
        this.data = null;
        manager = null;
    };

    //event listeners put here to remove on destroy
    this.onChangeListener = function (e, data) {
        var target = e.target;
        if ((target.nodeName === 'INPUT' && target.type == 'text') || target.nodeName == 'TEXTAREA') {
            if (target.value !== data.value) {
                data.value = target.value;
            }
        }
        else if (target.nodeName === 'INPUT' && target.type == 'checkbox') {
            if (target.checked !== data.value) {
                data.value = target.checked;
            }
        }
        else if (target.nodeName === 'SELECT') {
            if (target.value !== data.value) {
                data.value = target.value;
            }
        }
    }

    //replaces the {{ }} by the text. Cannot traverse upwards to parent yet.
    //skip in loop.
    this.replaceTextProperties = function (rootel, searchkey, replacetext) {
        var manager = this;
        //adjust key remove /. with .
        var replacekey = '{{' + replaceAll(searchkey, '\\\\', '') + '}}';

        //see if there are any to replace for this key.
        if (rootel.innerHTML.toLowerCase().indexOf(replacekey.toLowerCase()) > -1) {
            //get all childnodes.
            var elements = rootel.childNodes;

            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                //3 == text element
                if (element.nodeType === 3) {
                    var text = element.nodeValue;
                    if (text.trim() !== '') {
                        var replacedText = replaceAll(text, replacekey, replacetext);
                        if (replacedText !== text && closestWithAttribute(element.parentElement, 'loop') == null) {
                            rootel.replaceChild(document.createTextNode(replacedText), element);
                        }
                    }
                }
                    //1 = element node
                else if (element.nodeType === 1) {
                    //loop through attributes as well.
                    for (var e = 0; e < element.attributes.length; e++) {
                        var attr = element.attributes[e];
                        if (attr.value.toLowerCase().indexOf(replacekey.toLowerCase()) > -1) {
                            attr.value = replaceAll(attr.value, replacekey, replacetext);
                        }
                    }
                    //check element itself if there is any brackets.
                    if (element.hasChildNodes()) {
                        manager.replaceTextProperties(element, searchkey, replacetext);
                    }
                }
            }
            return;
        }
    }

    //Returns the initial updated object 
    this.getData = function () {
        //data to return.
        var returnCleanObject = function (d) {
            var data = {};
            //loop through all the properties.
            //if its an array of objects, loop through it
            if (d != null && typeof (d) == 'object') {
                Object.keys(d).forEach(function (k) {
                    var obj;
                    //if it's not a Field, it's because it wasn't bound so it was never converted to a field, return value.
                    if (d[k].constructor == Field) {
                        obj = d[k].value;

                    }
                    else {
                        obj = d[k];
                    }

                    //if obj is an array
                    if (obj instanceof Array) {

                        data[k] = [obj.length];
                        obj.forEach(function (dv, i) {
                            data[k][i] = returnCleanObject(dv);
                        });
                    }
                        //if the obj property is an object
                    else if (typeof (obj) == 'object') {
                        data[k] = returnCleanObject(obj);
                    }
                        //if obj is a primitive. 
                    else {
                        data[k] = obj;
                    }
                });
            }
            else
                data = d;

            return data;
        };

        return returnCleanObject(this.data);
    }
    //replace all function.
    var replaceAll = function (str, oldvalue, newvalue) {
        return str.replace(new RegExp((oldvalue), (true ? "gi" : "g")), newvalue);
    }
    //returns the object by string.
    //NOT USED NOW BUT CAN,but can be to fetch objects deep in.
    var objectbystring = function (o, s)
    {
        s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, '');           // strip a leading dot
        var a = s.split('.');
        for (var i = 0, n = a.length; i < n; ++i) {
            var k = a[i];
            if (k in o) {
                o = o[k];
            } else {
                return;
            }
        }
        return o;
        //OR
        //Object.resolve = function (path, obj) {
        //    return path.split('.').reduce(function (prev, curr) {
        //        return prev ? prev[curr] : undefined
        //    }, obj || self)
        //}
    }
    //polyfill for closest()
    var closestWithAttribute = function (el, attr) {
        // Traverse the DOM up with a while loop
        while (!el.hasAttribute(attr)) {
            //if there is no more elements or it's the root, your out.
            if (!el || el == rootElement) {
                return null;
            }
            // Increment the loop to the parent node
            if (el.parentNode == null) return null;
            el = el.parentNode;


        }
        // At this point, the while loop has stopped and `el` represents the element that has
        // the class you specified in the second parameter of the function `attr`
        // Then return the matched element
        return el;
    }
    //get the root element, start.
    this.bind(rootElement, this.data);
    //done loading, callback function
    if (callbackFunction != null) {
        callbackFunction();
    }
};

class Field {

    constructor(initial_value, elements) {
        this._value = null;
        this.elements = elements;
        this.value = initial_value;
        this.valueType = typeof (initial_value);
    }
    get value() {
        return this._value;
    }

    set value(new_value) {
        var obj = this;
        this._value = new_value;
        this.elements.forEach(function (v) {
            
            obj.setElementValues(v);
        });
    }
    addElement(v) {
        this.elements.push(v);
        this.setElementValues(v);
    }
    setElementValues(v) {
        if (typeof (this.value) == 'object') {
            
        }
        else if ((v.nodeName === 'INPUT' && v.type == 'text') || v.nodeName === 'SELECT' || v.nodeName == 'TEXTAREA') {
            v.value = this.value;
        }
        else if (v.nodeName === 'INPUT' && v.type == 'checkbox') {
            v.checked = this.value;
        }
        else if (v.nodeName === 'SPAN' || v.nodeName === 'LABEL') {
            v.innerText = this.value;
        }
    }
}