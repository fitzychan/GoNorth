(function(GoNorth) {
    "use strict";
    (function(BindingHandlers) {

        if(typeof ko !== "undefined")
        {

            /**
             * Code Editor Binding Handler
             */
            ko.bindingHandlers.codeEditor = {
                init: function (element, valueAccessor, allBindings) {
                    ace.require("ace/ext/language_tools");

                    var obs = valueAccessor();

                    // Read Config Values
                    var theme = null;
                    if(allBindings.get("codeEditorTheme"))
                    {
                        theme = ko.unwrap(allBindings.get("codeEditorTheme"));
                    }

                    if(!theme)
                    {
                        theme = "ace/theme/monokai";
                    }

                    var mode = null;
                    if(allBindings.get("codeEditorMode"))
                    {
                        mode = ko.unwrap(allBindings.get("codeEditorMode"));
                    }

                    if(!mode)
                    {
                        mode = "ace/mode/lua";
                    }

                    obs._editor = ace.edit(element);
                    obs._editor.setTheme(theme);
                    obs._editor.session.setMode(mode);
                    obs._editor.setOptions({
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true
                    });

                    if(ko.isObservable(obs))
                    {
                        obs._editor.session.on('change', function(delta) {
                            obs._blockUpdate = true;
                            try
                            {
                                obs(obs._editor.getValue());
                                obs._blockUpdate = false;
                            }
                            catch(e)
                            {
                                obs._blockUpdate = false;
                            }
                        });
                    }
                },
                update: function (element, valueAccessor, allBindings) {
                    var obs = valueAccessor();
                    var blockUpdate = obs._blockUpdate;
                    var value = obs;
                    if(ko.isObservable(value))
                    {
                        value = value();
                    }

                    var isReadonly = allBindings.get("codeEditorReadonly");
                    if(isReadonly)
                    {
                        isReadonly = ko.unwrap(isReadonly);
                        obs._editor.setReadOnly(isReadonly);
                    }

                    if(!blockUpdate)
                    {
                        obs._editor.session.setValue(value);
                    }
                }
            }

        }

    }(GoNorth.BindingHandlers = GoNorth.BindingHandlers || {}));
}(window.GoNorth = window.GoNorth || {}));