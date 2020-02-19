(function(GoNorth) {
    "use strict";
    (function(Util) {
        
        /**
         * Filters a list of fields for fields which can be used in a script
         * @param {object[]} fields Unfiltered fields
         * @returns {object[]} Filtered fields
         */
        Util.getFilteredFieldsForScript = function(fields) {
            if(!fields)
            {
                return [];
            }

            var filteredFields = [];
            for(var curField = 0; curField < fields.length; ++curField)
            {
                if(fields[curField].fieldType == GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldTypeMultiLine ||
                   fields[curField].fieldType == GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldGroup)
                {
                    continue;
                }
                filteredFields.push(fields[curField]);

                if(!fields[curField].scriptSettings || !fields[curField].scriptSettings.additionalScriptNames)
                {
                    continue;
                }

                // Add additional names
                var additionalNames = fields[curField].scriptSettings.additionalScriptNames.split(GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldScriptSettingsAdditionalScriptNameSeperator); 
                for(var curAdditionalName = 0; curAdditionalName < additionalNames.length; ++curAdditionalName)
                {
                    var additionalField = jQuery.extend({ }, fields[curField]);
                    additionalField.name = additionalNames[curAdditionalName];
                    filteredFields.push(additionalField);
                }
            }

            return filteredFields;
        }

    }(GoNorth.Util = GoNorth.Util || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(ProjectConfig) {
        (function(ConfigKeys) {

            /**
             * Config key for play an animation
             */
            ConfigKeys.PlayAnimationAction = "PlayAnimationAction";

            /**
             * Config key for setting the npc state
             */
            ConfigKeys.SetNpcStateAction = "SetNpcStateAction";

        }(ProjectConfig.ConfigKeys = ProjectConfig.ConfigKeys || {}));
    }(GoNorth.ProjectConfig = GoNorth.ProjectConfig || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(ChooseObjectDialog) {

        /// Dialog Page Size
        var dialogPageSize = 15;

        /**
         * Page View Model
         * @class
         */
        ChooseObjectDialog.ViewModel = function()
        {
            this.showDialog = new ko.observable(false);
            this.dialogTitle = new ko.observable("");
            this.showNewButtonInDialog = new ko.observable(false);
            this.dialogSearchCallback = null;
            this.dialogCreateNewCallback = null;
            this.dialogSearchPattern = new ko.observable("");
            this.dialogIsLoading = new ko.observable(false);
            this.dialogEntries = new ko.observableArray();
            this.dialogHasMore = new ko.observable(false);
            this.dialogCurrentPage = new ko.observable(0);
            this.errorOccured = new ko.observable(false);
            this.idObservable = null;

            this.choosingDeferred = null;
        };

        ChooseObjectDialog.ViewModel.prototype = {
            /**
             * Opens the dialog to search for npcs
             * 
             * @param {string} dialogTitle Title of the dialog
             * @param {function} createCallback Optional callback that will get triggered on hitting the new button, if none is provided the button will be hidden
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openNpcSearch: function(dialogTitle, createCallback) {
                return this.openDialog(dialogTitle, this.searchNpcs, createCallback, null);
            },

            /**
             * Opens the dialog to search for items
             * 
             * @param {string} dialogTitle Title of the dialog
             * @param {function} createCallback Optional callback that will get triggered on hitting the new button, if none is provided the button will be hidden
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openItemSearch: function(dialogTitle, createCallback) {
                return this.openDialog(dialogTitle, this.searchItems, createCallback, null);
            },

            /**
             * Opens the dialog to search for skills
             * 
             * @param {string} dialogTitle Title of the dialog
             * @param {function} createCallback Optional callback that will get triggered on hitting the new button, if none is provided the button will be hidden
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openSkillSearch: function(dialogTitle, createCallback) {
                return this.openDialog(dialogTitle, this.searchSkills, createCallback, null);
            },

            /**
             * Opens the dialog to search for kirja pages
             * 
             * @param {string} dialogTitle Title of the dialog
             * @param {function} createCallback Optional callback that will get triggered on hitting the new button, if none is provided the button will be hidden
             * @param {ko.observable} idObservable Optional id observable which will be used to exclude the current object from the search
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openKirjaPageSearch: function(dialogTitle, createCallback, idObservable) {
                return this.openDialog(dialogTitle, this.searchPages, createCallback, idObservable);
            },

            /**
             * Opens the dialog to search for quests
             * 
             * @param {string} dialogTitle Title of the dialog
             * @param {function} createCallback Optional callback that will get triggered on hitting the new button, if none is provided the button will be hidden
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openQuestSearch: function(dialogTitle, createCallback) {
                return this.openDialog(dialogTitle, this.searchQuest, createCallback, null);
            },

            /**
             * Opens the dialog to search for chapter details
             * 
             * @param {string} dialogTitle Title of the dialog
             * @param {function} createCallback Optional callback that will get triggered on hitting the new button, if none is provided the button will be hidden
             * @param {ko.observable} idObservable Optional id observable which will be used to exclude the current object from the search
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openChapterDetailSearch: function(dialogTitle, createCallback, idObservable) {
                return this.openDialog(dialogTitle, this.searchChapterDetails, createCallback, idObservable);
            },

            /**
             * Opens the dialog to search for daily routines
             * 
             * @param {string} dialogTitle Title of the dialog
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openDailyRoutineSearch: function(dialogTitle) {
                return this.openDialog(dialogTitle, this.searchDailyRoutines, null, null);
            },

            /**
             * Opens the dialog to search for markers
             * 
             * @param {string} dialogTitle Title of the dialog
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openMarkerSearch: function(dialogTitle) {
                return this.openDialog(dialogTitle, this.searchMarkers, null, null);
            },

            /**
             * Opens the dialog
             * 
             * @param {string} dialogTitle Title of the dialog
             * @param {function} searchCallback Function that gets called on starting a search
             * @param {function} createCallback Function that gets called on hitting t he new button
             * @param {ko.observable} idObservable Optional id observable which will be used to exclude the current object from the search
             * @returns {jQuery.Deferred} Deferred for the selecting process
             */
            openDialog: function(dialogTitle, searchCallback, createCallback, idObservable) {
                if(this.choosingDeferred)
                {
                    this.choosingDeferred.reject();
                    this.choosingDeferred = null;
                }

                this.showDialog(true);
                this.dialogTitle(dialogTitle);
                this.dialogCreateNewCallback = typeof createCallback == "function" ? createCallback : null;
                this.showNewButtonInDialog(this.dialogCreateNewCallback ? true : false);
                this.dialogSearchCallback = searchCallback;
                this.dialogSearchPattern("");
                this.dialogIsLoading(false);
                this.dialogEntries([]);
                this.dialogHasMore(false);
                this.dialogCurrentPage(0);
                this.idObservable = idObservable;

                this.choosingDeferred = new jQuery.Deferred();
                return this.choosingDeferred.promise();
            },

            /**
             * Expands an object if it has an expand callback, or selects an object
             * @param {object} selectedObject Selected object
             */
            handleObjectClick: function(selectedObject) {
                if(selectedObject.expandCallback) 
                {
                    selectedObject.expandCallback(selectedObject);
                }
                else
                {
                    this.selectObject(selectedObject);
                }
            },

            /**
             * Selects an object
             * 
             * @param {object} selectedObject Selected object
             */
            selectObject: function(selectedObject) {
                if(this.choosingDeferred)
                {
                    this.choosingDeferred.resolve(selectedObject);
                    this.choosingDeferred = null;
                }

                this.closeDialog();
            },

            /**
             * Cancels the dialog
             */
            cancelDialog: function() {
                if(this.choosingDeferred)
                {
                    this.choosingDeferred.reject();
                    this.choosingDeferred = null;
                }

                this.closeDialog();
            },

            /**
             * Closes the dialog
             */
            closeDialog: function() {
                this.showDialog(false);
            },

            /**
             * Starts a new dialog search
             */
            startNewDialogSearch: function() {
                this.dialogCurrentPage(0);
                this.dialogHasMore(false);
                this.runDialogSearch();
            },

            /**
             * Loads the previous dialog page
             */
            prevDialogPage: function() {
                this.dialogCurrentPage(this.dialogCurrentPage() - 1);
                this.runDialogSearch();
            },

            /**
             * Loads the previous dialog page
             */
            nextDialogPage: function() {
                this.dialogCurrentPage(this.dialogCurrentPage() + 1);
                this.runDialogSearch();
            },

            /**
             * Runs the dialog search
             */
            runDialogSearch: function() {
                this.dialogIsLoading(true);
                this.errorOccured(false);
                var self = this;
                this.dialogSearchCallback(this.dialogSearchPattern()).done(function(result) {
                    self.dialogHasMore(result.hasMore);
                    self.dialogEntries(result.entries);
                    self.dialogIsLoading(false);
                }).fail(function() {
                    self.errorOccured(true);
                    self.dialogIsLoading(false);
                });
            },

            /**
             * Creates a dialog object
             * 
             * @param {string} id Id of the object
             * @param {string} name Name of the object
             * @param {string} openLink Link to open the object
             */
            createDialogObject: function(id, name, openLink) {
                return {
                    id: id,
                    name: name,
                    openLink: openLink,
                    expandCallback: null,
                    isExpanded: new ko.observable(false),
                    isLoadingExpandedObject: new ko.observable(false),
                    errorLoadingExpandedObject: new ko.observable(false),
                    expandedObjects: new ko.observableArray(),
                    hasExpandedObjectsLoaded: false
                };
            },
            
            /**
             * Creates a dialog object
             * 
             * @param {string} id Id of the object
             * @param {string} name Name of the object
             * @param {string} openLink Link to open the object
             * @param {function} expandCallback Callback function to expand
             */
            createExpandableDialogObject: function(id, name, openLink, expandCallback) {
                var dialogObject = this.createDialogObject(id, name, openLink);
                dialogObject.expandCallback = expandCallback;
                
                return dialogObject;
            },

            /**
             * Searches kirja pages
             * 
             * @param {string} searchPattern Search Pattern
             * @returns {jQuery.Deferred} Deferred for the result
             */
            searchPages: function(searchPattern) {
                var def = new jQuery.Deferred();

                var searchUrl = "/api/KirjaApi/SearchPages?searchPattern=" + encodeURIComponent(searchPattern) + "&start=" + (this.dialogCurrentPage() * dialogPageSize) + "&pageSize=" + dialogPageSize;
                if(this.idObservable)
                {
                    searchUrl += "&excludeId=" + this.idObservable();
                }

                var self = this;
                jQuery.ajax({ 
                    url: searchUrl, 
                    type: "GET"
                }).done(function(data) {
                    var result = {
                        hasMore: data.hasMore,
                        entries: []
                    };

                    for(var curEntry = 0; curEntry < data.pages.length; ++curEntry)
                    {
                        result.entries.push(self.createDialogObject(data.pages[curEntry].id, data.pages[curEntry].name, "/Kirja?id=" + data.pages[curEntry].id));
                    }

                    def.resolve(result);
                }).fail(function() {
                    def.reject();
                });

                return def.promise();
            },

            /**
             * Opens a page to create a new kirja page
             */
            openCreatePage: function() {
                this.dialogCreateNewCallback();
            },


            /**
             * Searches kortisto npcs
             * 
             * @param {string} searchPattern Search Pattern
             * @returns {jQuery.Deferred} Deferred for the result
             */
            searchNpcs: function(searchPattern) {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/KortistoApi/SearchFlexFieldObjects?searchPattern=" + encodeURIComponent(searchPattern) + "&start=" + (this.dialogCurrentPage() * dialogPageSize) + "&pageSize=" + dialogPageSize, 
                    type: "GET"
                }).done(function(data) {
                    var result = {
                        hasMore: data.hasMore,
                        entries: []
                    };

                    for(var curEntry = 0; curEntry < data.flexFieldObjects.length; ++curEntry)
                    {
                        result.entries.push(self.createDialogObject(data.flexFieldObjects[curEntry].id, data.flexFieldObjects[curEntry].name, "/Kortisto/Npc?id=" + data.flexFieldObjects[curEntry].id));
                    }

                    def.resolve(result);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            },


            /**
             * Searches styr items
             * 
             * @param {string} searchPattern Search Pattern
             * @returns {jQuery.Deferred} Deferred for the result
             */
            searchItems: function(searchPattern) {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/StyrApi/SearchFlexFieldObjects?searchPattern=" + encodeURIComponent(searchPattern) + "&start=" + (this.dialogCurrentPage() * dialogPageSize) + "&pageSize=" + dialogPageSize, 
                    type: "GET"
                }).done(function(data) {
                    var result = {
                        hasMore: data.hasMore,
                        entries: []
                    };

                    for(var curEntry = 0; curEntry < data.flexFieldObjects.length; ++curEntry)
                    {
                        result.entries.push(self.createDialogObject(data.flexFieldObjects[curEntry].id, data.flexFieldObjects[curEntry].name, "/Styr/Item?id=" + data.flexFieldObjects[curEntry].id));
                    }

                    def.resolve(result);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            },


            /**
             * Searches Evne skills
             * 
             * @param {string} searchPattern Search Pattern
             * @returns {jQuery.Deferred} Deferred for the result
             */
            searchSkills: function(searchPattern) {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/EvneApi/SearchFlexFieldObjects?searchPattern=" + encodeURIComponent(searchPattern) + "&start=" + (this.dialogCurrentPage() * dialogPageSize) + "&pageSize=" + dialogPageSize, 
                    type: "GET"
                }).done(function(data) {
                    var result = {
                        hasMore: data.hasMore,
                        entries: []
                    };

                    for(var curEntry = 0; curEntry < data.flexFieldObjects.length; ++curEntry)
                    {
                        result.entries.push(self.createDialogObject(data.flexFieldObjects[curEntry].id, data.flexFieldObjects[curEntry].name, "/Evne/Skill?id=" + data.flexFieldObjects[curEntry].id));
                    }

                    def.resolve(result);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            },


            /**
             * Searches aika quests
             * 
             * @param {string} searchPattern Search Pattern
             * @returns {jQuery.Deferred} Deferred for the result
             */
            searchQuest: function(searchPattern) {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/AikaApi/GetQuests?searchPattern=" + encodeURIComponent(searchPattern) + "&start=" + (this.dialogCurrentPage() * dialogPageSize) + "&pageSize=" + dialogPageSize, 
                    type: "GET"
                }).done(function(data) {
                    var result = {
                        hasMore: data.hasMore,
                        entries: []
                    };

                    for(var curEntry = 0; curEntry < data.quests.length; ++curEntry)
                    {
                        result.entries.push(self.createDialogObject(data.quests[curEntry].id, data.quests[curEntry].name, "/Aika/Quest?id=" + data.quests[curEntry].id));
                    }

                    def.resolve(result);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            },

            /**
             * Searches aika chapter details
             * 
             * @param {string} searchPattern Search Pattern
             * @returns {jQuery.Deferred} Deferred for the result
             */
            searchChapterDetails: function(searchPattern) {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/AikaApi/GetChapterDetails?searchPattern=" + encodeURIComponent(searchPattern) + "&start=" + (this.dialogCurrentPage() * dialogPageSize) + "&pageSize=" + dialogPageSize, 
                    type: "GET"
                }).done(function(data) {
                    var result = {
                        hasMore: data.hasMore,
                        entries: []
                    };

                    for(var curEntry = 0; curEntry < data.details.length; ++curEntry)
                    {
                        if(self.idObservable && self.idObservable() == data.details[curEntry].id)
                        {
                            continue;
                        }

                        result.entries.push(self.createDialogObject(data.details[curEntry].id, data.details[curEntry].name, "/Aika/Detail?id=" + data.details[curEntry].id));
                    }

                    def.resolve(result);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            },
            
            /**
             * Searches daily routines
             * 
             * @param {string} searchPattern Search Pattern
             * @returns {jQuery.Deferred} Deferred for the result
             */
            searchDailyRoutines: function(searchPattern) {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/KortistoApi/SearchFlexFieldObjects?searchPattern=" + encodeURIComponent(searchPattern) + "&start=" + (this.dialogCurrentPage() * dialogPageSize) + "&pageSize=" + dialogPageSize, 
                    type: "GET"
                }).done(function(data) {
                    var result = {
                        hasMore: data.hasMore,
                        entries: []
                    };

                    for(var curEntry = 0; curEntry < data.flexFieldObjects.length; ++curEntry)
                    {
                        result.entries.push(self.createExpandableDialogObject(data.flexFieldObjects[curEntry].id, data.flexFieldObjects[curEntry].name, "/Kortisto/Npc?id=" + data.flexFieldObjects[curEntry].id, function(dailyRoutineEventNpc) { self.expandDailyRoutineNpc(dailyRoutineEventNpc); }));
                    }

                    def.resolve(result);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            },

            /**
             * Expands a daily routine npc
             * @param {object} dailyRoutineEventNpc Daily routine npc
             */
            expandDailyRoutineNpc: function(dailyRoutineEventNpc) {
                dailyRoutineEventNpc.isExpanded(!dailyRoutineEventNpc.isExpanded());
                if(dailyRoutineEventNpc.hasExpandedObjectsLoaded)
                {
                    return;
                }

                dailyRoutineEventNpc.isLoadingExpandedObject(true);
                dailyRoutineEventNpc.errorLoadingExpandedObject(false);
                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + dailyRoutineEventNpc.id, 
                    type: "GET"
                }).done(function(data) {
                    var dailyRoutineObjects = [];
                    if(data.dailyRoutine)
                    {
                        for(var curEvent = 0; curEvent < data.dailyRoutine.length; ++curEvent)
                        {
                            data.dailyRoutine[curEvent].parentObject = dailyRoutineEventNpc;
                            data.dailyRoutine[curEvent].name = GoNorth.DailyRoutines.Util.formatTimeSpan("hh:mm", data.dailyRoutine[curEvent].earliestTime, data.dailyRoutine[curEvent].latestTime);
                            var additionalName = "";
                            if(data.dailyRoutine[curEvent].scriptName)
                            {
                                additionalName = data.dailyRoutine[curEvent].scriptName;
                            }
                            else if(data.dailyRoutine[curEvent].movementTarget && data.dailyRoutine[curEvent].movementTarget.name)
                            {
                                additionalName = data.dailyRoutine[curEvent].movementTarget.name;
                            }
                            data.dailyRoutine[curEvent].additionalName = additionalName;
                            dailyRoutineObjects.push(data.dailyRoutine[curEvent]);
                        }
                    }
                    dailyRoutineEventNpc.isLoadingExpandedObject(false);
                    dailyRoutineEventNpc.expandedObjects(dailyRoutineObjects);
                    dailyRoutineEventNpc.hasExpandedObjectsLoaded = true;
                }).fail(function(xhr) {
                    dailyRoutineEventNpc.isLoadingExpandedObject(false);
                    dailyRoutineEventNpc.errorLoadingExpandedObject(true);
                });
            },

            
            /**
             * Searches markers
             * 
             * @param {string} searchPattern Search Pattern
             * @returns {jQuery.Deferred} Deferred for the result
             */
            searchMarkers: function(searchPattern) {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/KartaApi/SearchMarkersByExportName?searchPattern=" + encodeURIComponent(searchPattern) + "&start=" + (this.dialogCurrentPage() * dialogPageSize) + "&pageSize=" + dialogPageSize, 
                    type: "GET"
                }).done(function(data) {
                    var result = {
                        hasMore: data.hasMore,
                        entries: []
                    };

                    for(var curEntry = 0; curEntry < data.markers.length; ++curEntry)
                    {
                        var dialogObject = self.createDialogObject(data.markers[curEntry].markerId, data.markers[curEntry].markerName + " (" + data.markers[curEntry].mapName + ")", "/Karta?id=" + data.markers[curEntry].mapId + "&zoomOnMarkerId=" + data.markers[curEntry].markerId + "&zoomOnMarkerType=" + data.markers[curEntry].markerType);
                        dialogObject.markerName = data.markers[curEntry].markerName;
                        dialogObject.markerType = data.markers[curEntry].markerType;
                        dialogObject.mapId = data.markers[curEntry].mapId;
                        dialogObject.mapName = data.markers[curEntry].mapName;
                        result.entries.push(dialogObject);
                    }

                    def.resolve(result);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            },
            
        };

    }(GoNorth.ChooseObjectDialog = GoNorth.ChooseObjectDialog || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(BindingHandlers) {

        if(typeof ko !== "undefined")
        {
            /**
             * Builds a time object for custom time frame
             * @param {number} hours Hours
             * @param {number} minutes Minutes
             * @returns {object} Time object
             */
            BindingHandlers.buildTimeObject = function(hours, minutes) {
                return {
                    hours: hours,
                    minutes: minutes
                };
            }

            /**
             * Compares two time objects
             * @param {object} d1 Time object 1
             * @param {object} d2 Time object 2
             * @returns {number} Compare value
             */
            BindingHandlers.compareTimes = function(d1, d2) {
                if(d1.hours < d2.hours) {
                    return -1;
                } else if(d2.hours < d1.hours) {
                    return 1;
                } else if(d1.minutes < d2.minutes) {
                    return -1;
                } else if(d2.minutes < d1.minutes) {
                    return 1;
                }

                return 0;
            }

            /**
             * Returns the time values for a timepicker
             * @param {object} containerElement Container element
             * @param {object} hoursPerDay Hours per day
             * @param {object} minutesPerHour Minutes per hour
             * @returns {object} Time Values
             */
            function getTimeValue(containerElement, hoursPerDay, minutesPerHour) {
                var hours = parseInt(containerElement.find(".gn-timePickerHour").val());
                if(isNaN(hours)) {
                    hours = 0;
                }

                var minutes = parseInt(containerElement.find(".gn-timePickerMinutes").val());
                if(isNaN(minutes)) {
                    minutes = 0;
                }

                hoursPerDay = ko.utils.unwrapObservable(hoursPerDay);
                minutesPerHour = ko.utils.unwrapObservable(minutesPerHour);
                hours = Math.abs(hours) % hoursPerDay;
                minutes = Math.abs(minutes) % minutesPerHour;

                return BindingHandlers.buildTimeObject(hours, minutes);
            }

            /**
             * Updates the time value
             * @param {object} containerElement Container Element
             * @param {function} changeCallback Change callback
             * @param {object} hoursPerDay Hours per day
             * @param {object} minutesPerHour Minutes per hour
             */
            function updateTimeValue(containerElement, changeCallback, hoursPerDay, minutesPerHour)
            {
                changeCallback(getTimeValue(containerElement, hoursPerDay, minutesPerHour));

                updateTimeDisplay(containerElement, hoursPerDay, minutesPerHour);
            }

            /**
             * Updates the time display
             * @param {object} element HTML Element to fill
             * @param {object} hoursPerDay Hours per day
             * @param {object} minutesPerHour Minutes per hour
             */
            function updateTimeDisplay(element, hoursPerDay, minutesPerHour) {
                var containerElement = jQuery(element).closest(".gn-timePickerMainContainer");
                var timeValues = getTimeValue(containerElement, hoursPerDay, minutesPerHour);

                var targetElement = containerElement.find(".gn-timePickerMain");
                var format = targetElement.data("gn-timePickerFormat");
                var formattedTime = GoNorth.Util.formatTime(timeValues.hours, timeValues.minutes, format);
                targetElement.val(formattedTime);
            }

            /**
             * Changes the time value in a given direction
             * @param {object} element HTML Input element
             * @param {number} direction Direction
             * @param {function} changeCallback Change callback
             * @param {number} hoursPerDay Hours per day
             * @param {number} minutesPerHour Minutes per hour
             */
            function changeTimeValue(element, direction, changeCallback, hoursPerDay, minutesPerHour) {
                var value = parseInt(jQuery(element).val());
                if(isNaN(value)) {
                    value = 0;
                } else {
                    value += direction;
                }

                var maxValue = 0;
                if(jQuery(element).hasClass("gn-timePickerHour")) {
                    maxValue = ko.utils.unwrapObservable(hoursPerDay);
                } else {
                    maxValue = ko.utils.unwrapObservable(minutesPerHour);
                }

                if(value < 0) {
                    value = maxValue - 1;
                } else if(value >= maxValue) {
                    value = 0;
                }

                jQuery(element).val(value);
                updateTimeDisplay(element, hoursPerDay, minutesPerHour);
                updateTimeValue(jQuery(element).closest(".gn-timePickerMainContainer"), changeCallback, hoursPerDay, minutesPerHour);
            }

            /**
             * Initializes the time picker
             * @param {object} element HTML Element
             * @param {function} changeCallback Change callback function
             * @param {number} hoursPerDay Hours per day
             * @param {number} minutesPerHour Minutes per hour
             * @param {string} timeFormat Time format
             * @param {function} onOpen Optional callback function on opening the time callout
             * @param {function} onClose Optiona callback function on closing the time callout
             * @param {boolean} dontStyle true if the timepicker formats should not be applied, else false
             */
            BindingHandlers.initTimePicker = function(element, changeCallback, hoursPerDay, minutesPerHour, timeFormat, onOpen, onClose, dontStyle) {
                jQuery(element).wrap("<div class='gn-timePickerMainContainer" + (!dontStyle ? " gn-timePickerMainContainerStyling" : "") + "'></div>");
                jQuery('<div class="dropdown-menu">' +
                    '<div class="gn-timePickerControlContainer">' +
                        '<div class="gn-timePickerSingleControlContainer gn-timePickerSingleControlContainerHours">' +
                            '<button class="btn btn-link gn-timePickerButtonUp gn-timePickerButtonHours" tabindex="-1" type="button"><span class="glyphicon glyphicon-chevron-up"></span></button>' +
                            '<input type="text" class="' + (!dontStyle ? 'form-control ' : '') + 'gn-timePickerInput gn-timePickerHour">' +
                            '<button class="btn btn-link gn-timePickerButtonDown gn-timePickerButtonHours" tabindex="-1" type="button"><span class="glyphicon glyphicon-chevron-down"></span></button>' +
                        '</div>' +
                        '<div class="gn-timePickerSeperator">:</div>' +
                        '<div class="gn-timePickerSingleControlContainer">' +
                            '<button class="btn btn-link gn-timePickerButtonUp gn-timePickerButtonMinutes" tabindex="-1" type="button"><span class="glyphicon glyphicon-chevron-up"></span></button>' +
                            '<input type="text" class="' + (!dontStyle ? 'form-control ' : '') + 'gn-timePickerInput gn-timePickerMinutes"> ' +
                            '<button class="btn btn-link gn-timePickerButtonDown gn-timePickerButtonMinutes" tabindex="-1" type="button"><span class="glyphicon glyphicon-chevron-down"></span></button>' +
                        '</div>' +
                    '</div>' +
                '</div>').insertAfter(element);
                jQuery(element).prop("readonly", true);
                jQuery(element).addClass("gn-timePickerMain");
                if(!dontStyle) {
                    jQuery(element).addClass("gn-timePickerMainStyling");
                }
                if(!timeFormat) {
                    timeFormat = "hh:mm";
                }
                jQuery(element).data("gn-timePickerFormat", timeFormat);

                var containerElement = jQuery(element).parent();
                jQuery(element).focus(function() {
                    if(onOpen) {
                        onOpen();
                    }
                    containerElement.children(".dropdown-menu").addClass("show");
                    containerElement.find(".gn-timePickerHour").focus();
                    setTimeout(function() {
                        containerElement.find(".gn-timePickerHour").focus();
                    }, 50);
                });
                containerElement.find("input").blur(function() {
                    var target = jQuery(event.relatedTarget);
                    if(!target.closest(containerElement).length) {
                        containerElement.children(".dropdown-menu").removeClass("show");
                        if(onClose) {
                            onClose();
                        }
                    }

                    updateTimeValue(containerElement, changeCallback, hoursPerDay, minutesPerHour);
                });
                var closeHandler = null;
                closeHandler = function() {
                    if(!jQuery.contains(document, containerElement[0]))
                    {
                        jQuery(document).unbind("click", closeHandler);
                        return;
                    }

                    var target = jQuery(event.target);
                    if(!target.closest(containerElement).length) {
                        containerElement.children(".dropdown-menu").removeClass("show");
                        if(onClose) {
                            onClose();
                        }
                    }
                };
                jQuery(document).on("click", closeHandler);

                containerElement.find("input").keydown(function(e) {
                    if(e.keyCode == 38) {           // Arrow up
                        changeTimeValue(this, 1, changeCallback, hoursPerDay, minutesPerHour);
                        e.preventDefault();
                        return;
                    } else if(e.keyCode == 40) {    // Arrow down
                        changeTimeValue(this, -1, changeCallback, hoursPerDay, minutesPerHour);
                        e.preventDefault();
                        return;
                    }

                    GoNorth.Util.validateNumberKeyPress(element, e);
                });

                containerElement.find(".btn-link").click(function() {
                    var targetElement = ".gn-timePickerHour";
                    if(jQuery(this).hasClass("gn-timePickerButtonMinutes")) {
                        targetElement = ".gn-timePickerMinutes";
                    }

                    var direction = 1;
                    if(jQuery(this).hasClass("gn-timePickerButtonDown")) {
                        direction = -1;
                    }

                    changeTimeValue(containerElement.find(targetElement), direction, changeCallback, hoursPerDay, minutesPerHour);
                });
            }

            /**
             * Sets the time picker value
             * @param {object} element HTML Element
             * @param {number} hours Hours
             * @param {number} minutes Minutes
             * @param {number} hoursPerDay Hours per day
             * @param {number} minutesPerHour Minutes per hours
             */
            BindingHandlers.setTimePickerValue = function(element, hours, minutes, hoursPerDay, minutesPerHour) {
                var containerElement = jQuery(element).parent();
                containerElement.find(".gn-timePickerHour").val(hours);
                containerElement.find(".gn-timePickerMinutes").val(minutes);
                updateTimeDisplay(element, hoursPerDay, minutesPerHour);
            }

            /**
             * Timepicker Binding Handler with custom timeframe (hours, minutes)
             */
            ko.bindingHandlers.timepicker = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var updatedFunction = function(newValue) {
                        valueAccessor()(newValue);
                    };
                    BindingHandlers.initTimePicker(element, updatedFunction, allBindings.get("timepickerHoursPerDay"), allBindings.get("timepickerMinutesPerHour"), allBindings.get("timepickerFormat"));
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var timeValues = ko.utils.unwrapObservable(valueAccessor());
                    BindingHandlers.setTimePickerValue(element, timeValues.hours, timeValues.minutes, allBindings.get("timepickerHoursPerDay"), allBindings.get("timepickerMinutesPerHour"));
                }
            };
        }

    }(GoNorth.BindingHandlers = GoNorth.BindingHandlers || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(ImplementationStatus) {
        (function(CompareDialog) {

            /**
             * Compare Dialog View Model
             * @class
             */
            CompareDialog.ViewModel = function()
            {
                this.isOpen = new ko.observable(false);
                var self = this;
                this.isOpen.subscribe(function(newValue) {
                    if(!newValue && self.markAsImplementedPromise)
                    {
                        self.markAsImplementedPromise.reject();
                    }
                });
                this.objectName = new ko.observable("");

                this.isLoading = new ko.observable(false);
                this.errorOccured = new ko.observable(false);

                this.markAsImplementedPromise = null;
                this.flagAsImplementedMethodUrlPostfix = null;

                this.doesSnapshotExists = new ko.observable(false);
                this.difference = new ko.observableArray();
            };

            CompareDialog.ViewModel.prototype = {
                /**
                 * Opens the compare dialog for an npc compare call
                 * 
                 * @param {string} id Id of the npc
                 * @param {string} npcName Name of the npc to display in the title
                 * @returns {jQuery.Deferred} Deferred that will get resolved after the object was marked as implemented
                 */
                openNpcCompare: function(id, npcName) {
                    this.isOpen(true);
                    this.objectName(npcName ? npcName : "");
                    this.flagAsImplementedMethodUrlPostfix = "FlagNpcAsImplemented?npcId=" + id;

                    return this.loadCompareResult("CompareNpc?npcId=" + id);
                },

                /**
                 * Opens the compare dialog for an item compare call
                 * 
                 * @param {string} id Id of the item
                 * @param {string} itemName Name of the item to display in the title
                 * @returns {jQuery.Deferred} Deferred that will get resolved after the object was marked as implemented
                 */
                openItemCompare: function(id, itemName) {
                    this.isOpen(true);
                    this.objectName(itemName ? itemName : "");
                    this.flagAsImplementedMethodUrlPostfix = "FlagItemAsImplemented?itemId=" + id;

                    return this.loadCompareResult("CompareItem?itemId=" + id);
                },

                /**
                 * Opens the compare dialog for a skill compare call
                 * 
                 * @param {string} id Id of the skill
                 * @param {string} skillName Name of the skill to display in the title
                 * @returns {jQuery.Deferred} Deferred that will get resolved after the object was marked as implemented
                 */
                openSkillCompare: function(id, skillName) {
                    this.isOpen(true);
                    this.objectName(skillName ? skillName : "");
                    this.flagAsImplementedMethodUrlPostfix = "FlagSkillAsImplemented?skillId=" + id;

                    return this.loadCompareResult("CompareSkill?skillId=" + id);
                },

                /**
                 * Opens the compare dialog for a dialog compare call
                 * 
                 * @param {string} id Id of the dialog
                 * @param {string} dialogName Name of the dialog to display in the title
                 * @returns {jQuery.Deferred} Deferred that will get resolved after the object was marked as implemented
                 */
                openDialogCompare: function(id, dialogName) {
                    this.isOpen(true);
                    this.objectName(dialogName ? dialogName : "");
                    this.flagAsImplementedMethodUrlPostfix = "FlagDialogAsImplemented?dialogId=" + id;

                    return this.loadCompareResult("CompareDialog?dialogId=" + id);
                },

                /**
                 * Opens the compare dialog for a quest compare call
                 * 
                 * @param {string} id Id of the quest
                 * @param {string} questName Name of the quest to display in the title
                 * @returns {jQuery.Deferred} Deferred that will get resolved after the object was marked as implemented
                 */
                openQuestCompare: function(id, questName) {
                    this.isOpen(true);
                    this.objectName(questName ? questName : "");
                    this.flagAsImplementedMethodUrlPostfix = "FlagQuestAsImplemented?questId=" + id;

                    return this.loadCompareResult("CompareQuest?questId=" + id);
                },
                
                /**
                 * Opens the compare dialog for a marker compare call
                 * 
                 * @param {string} mapId Id of the map
                 * @param {string} markerId Id of the marker
                 * @param {string} markerType Type of the marker
                 * @returns {jQuery.Deferred} Deferred that will get resolved after the object was marked as implemented
                 */
                openMarkerCompare: function(mapId, markerId, markerType) {
                    this.isOpen(true);
                    this.objectName("");
                    this.flagAsImplementedMethodUrlPostfix = "FlagMarkerAsImplemented?mapId=" + mapId + "&markerId=" + markerId + "&markerType=" + markerType;

                    return this.loadCompareResult("CompareMarker?mapId=" + mapId + "&markerId=" + markerId + "&markerType=" + markerType);
                },


                /**
                 * Loads a compare result
                 * 
                 * @param {string} urlPostfix Postfix for the url
                 */
                loadCompareResult: function(urlPostfix) {
                    this.isLoading(true);
                    this.errorOccured(false);
                    this.difference([]);
                    var self = this;
                    jQuery.ajax({ 
                        url: "/api/ImplementationStatusApi/" + urlPostfix, 
                        type: "GET"
                    }).done(function(compareResult) {
                        self.isLoading(false);
                        self.addExpandedObservable(compareResult.compareDifference);
                        self.doesSnapshotExists(compareResult.doesSnapshotExist);
                        if(compareResult.compareDifference)
                        {
                            self.difference(compareResult.compareDifference);
                        }
                    }).fail(function() {
                        self.isLoading(false);
                        self.errorOccured(true);
                    });

                    this.markAsImplementedPromise = new jQuery.Deferred();
                    return this.markAsImplementedPromise.promise();
                },

                /**
                 * Adds the expanded observable to all compare results
                 * 
                 * @param {object[]} compareResults Compare REsults to which the expanded observable must be added
                 */
                addExpandedObservable: function(compareResults) {
                    if(!compareResults)
                    {
                        return;
                    }

                    for(var curResult = 0; curResult < compareResults.length; ++curResult)
                    {
                        compareResults[curResult].isExpanded = new ko.observable(true);
                        this.addExpandedObservable(compareResults[curResult].subDifferences);
                    }
                },

                /**
                 * Toggles a compare result to be epanded or not
                 * 
                 * @param {object} compareResult Compare Result
                 */
                toggleCompareResultExpanded: function(compareResult) {
                    compareResult.isExpanded(!compareResult.isExpanded());
                },


                /**
                 * Marks the object for which the dialog is opened as implemented
                 */
                markAsImplemented: function() {
                    this.isLoading(true);
                    this.errorOccured(false);
                    var self = this;
                    jQuery.ajax({ 
                        url: "/api/ImplementationStatusApi/" + this.flagAsImplementedMethodUrlPostfix, 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        type: "POST"
                    }).done(function() {
                        if(window.refreshImplementationStatusList)
                        {
                            window.refreshImplementationStatusList();
                        }

                        self.markAsImplementedPromise.resolve();
                        self.markAsImplementedPromise = null;

                        self.isLoading(false);
                        self.isOpen(false);
                    }).fail(function() {
                        self.isLoading(false);
                        self.errorOccured(true);
                    });
                },

                /**
                 * Closes the dialog
                 */
                closeDialog: function() {
                    this.isOpen(false);
                }
            };

        }(ImplementationStatus.CompareDialog = ImplementationStatus.CompareDialog || {}));
    }(GoNorth.ImplementationStatus = GoNorth.ImplementationStatus || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /// Seperator for the additional name field values
            ObjectForm.FlexFieldScriptSettingsAdditionalScriptNameSeperator = ",";

            /**
             * Class for a flex field script settings
             * 
             * @class
             */
            ObjectForm.FlexFieldScriptSettings = function() {
                this.dontExportToScript = false;
                this.additionalScriptNames = "";
            }

            ObjectForm.FlexFieldScriptSettings.prototype = {
                /**
                 * Serializes the values to an object
                 * 
                 * @returns {object} Object to deserialize
                 */
                serialize: function() {
                    return {
                        dontExportToScript: this.dontExportToScript,
                        additionalScriptNames: this.additionalScriptNames
                    };
                },

                /**
                 * Deserialize the values from a serialized entry
                 * @param {object} serializedValue Serialized entry
                 */
                deserialize: function(serializedValue) {
                    this.dontExportToScript = serializedValue.dontExportToScript;
                    this.additionalScriptNames = serializedValue.additionalScriptNames;
                }
            }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Interface for flex field fields
             * 
             * @class
             */
            ObjectForm.FlexFieldBase = function() {
                this.id = new ko.observable("");
                this.createdFromTemplate = new ko.observable(false);
                this.name = new ko.observable();
                this.scriptSettings = new ObjectForm.FlexFieldScriptSettings();
            }

            ObjectForm.FlexFieldBase.prototype = {
                /**
                 * Returns the type of the field
                 * 
                 * @returns {int} Type of the field
                 */
                getType: function() { },

                /**
                 * Returns the template name
                 * 
                 * @returns {string} Template Name
                 */
                getTemplateName: function() { },

                /**
                 * Returns if the field can be exported to a script
                 * 
                 * @returns {bool} true if the value can be exported to a script, else false
                 */
                canExportToScript: function() { },

                /**
                 * Serializes the value to a string
                 * 
                 * @param {number} fieldIndex Index of the field in the final serialization
                 * @returns {string} Value of the field as a string
                 */
                serializeValue: function(fieldIndex) { },

                /**
                 * Deserializes a value from a string
                 * 
                 * @param {string} value Value to Deserialize
                 */
                deserializeValue: function(value) { },

                /**
                 * Returns all child fields
                 * 
                 * @returns {FlexFieldBase[]} Children of the field, null if no children exist
                 */
                getChildFields: function() { return null; },

                /**
                 * Returns true if the field has additional configuration, else false
                 * 
                 * @returns {bool} true if the field has additional configuration, else false
                 */
                hasAdditionalConfiguration: function() { return false; },

                /**
                 * Returns the label for additional configuration
                 * 
                 * @returns {string} Additional Configuration
                 */
                getAdditionalConfigurationLabel: function() { return ""; },

                /**
                 * Returns true if the additional configuration can be edited for fields that were created based on template fields, else false
                 * 
                 * @returns {bool} true if the additional configuration can be edited for fields that were created based on template fields, else false
                 */
                allowEditingAdditionalConfigForTemplateFields: function() { return false; },

                /**
                 * Sets additional configuration
                 * 
                 * @param {string} configuration Additional Configuration
                 */
                setAdditionalConfiguration: function(configuration) { },

                /**
                 * Returns additional configuration
                 * 
                 * @returns {string} Additional Configuration
                 */
                getAdditionalConfiguration: function() { return ""; },

                /**
                 * Serializes the additional configuration
                 * 
                 * @returns {string} Serialized additional configuration
                 */
                serializeAdditionalConfiguration: function() { return ""; },

                /**
                 * Deserializes the additional configuration
                 * 
                 * @param {string} additionalConfiguration Serialized additional configuration
                 */
                deserializeAdditionalConfiguration: function(additionalConfiguration) { },


                /**
                 * Groups fields into the field
                 * 
                 * @param {FlexFieldBase[]} fields Root List of fields
                 * @param {object} fieldsToRemoveFromRootList Object to track fields that must be removed from the root list
                 */
                groupFields: function(fields, fieldsToRemoveFromRootList) { }
            }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Type of the single text line field
             */
            ObjectForm.FlexFieldTypeSingleLine = 0;

            /**
             * Class for a single text line field
             * 
             * @class
             */
            ObjectForm.SingleLineFlexField = function() {
                ObjectForm.FlexFieldBase.apply(this);

                this.value = new ko.observable("");
            }

            ObjectForm.SingleLineFlexField.prototype = jQuery.extend(true, {}, ObjectForm.FlexFieldBase.prototype);

            /**
             * Returns the type of the field
             * 
             * @returns {int} Type of the field
             */
            ObjectForm.SingleLineFlexField.prototype.getType = function() { return ObjectForm.FlexFieldTypeSingleLine; }

            /**
             * Returns the template name
             * 
             * @returns {string} Template Name
             */
            ObjectForm.SingleLineFlexField.prototype.getTemplateName = function() { return "gn-singleLineField"; }

            /**
             * Returns if the field can be exported to a script
             * 
             * @returns {bool} true if the value can be exported to a script, else false
             */
            ObjectForm.SingleLineFlexField.prototype.canExportToScript = function() { return true; }

            /**
             * Serializes the value to a string
             * 
             * @returns {string} Value of the field as a string
             */
            ObjectForm.SingleLineFlexField.prototype.serializeValue = function() { return this.value(); }

            /**
             * Deserializes a value from a string
             * 
             * @param {string} value Value to Deserialize
             */
            ObjectForm.SingleLineFlexField.prototype.deserializeValue = function(value) { this.value(value); }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Type of the multi text line field
             */
            ObjectForm.FlexFieldTypeMultiLine = 1;

            /**
             * Class for a multi text line field
             * 
             * @class
             */
            ObjectForm.MultiLineFlexField = function() {
                ObjectForm.FlexFieldBase.apply(this);

                this.value = new ko.observable("");
            }

            ObjectForm.MultiLineFlexField.prototype = jQuery.extend(true, {}, ObjectForm.FlexFieldBase.prototype);

            /**
             * Returns the type of the field
             * 
             * @returns {int} Type of the field
             */
            ObjectForm.MultiLineFlexField.prototype.getType = function() { return ObjectForm.FlexFieldTypeMultiLine; }

            /**
             * Returns the template name
             * 
             * @returns {string} Template Name
             */
            ObjectForm.MultiLineFlexField.prototype.getTemplateName = function() { return "gn-multiLineField"; }

            /**
             * Returns if the field can be exported to a script
             * 
             * @returns {bool} true if the value can be exported to a script, else false
             */
            ObjectForm.MultiLineFlexField.prototype.canExportToScript = function() { return false; }

            /**
             * Serializes the value to a string
             * 
             * @returns {string} Value of the field as a string
             */
            ObjectForm.MultiLineFlexField.prototype.serializeValue = function() { return this.value(); }

            /**
             * Deserializes a value from a string
             * 
             * @param {string} value Value to Deserialize
             */
            ObjectForm.MultiLineFlexField.prototype.deserializeValue = function(value) { this.value(value); }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Type of the number field
             */
            ObjectForm.FlexFieldTypeNumber = 2;

            /**
             * Class for a number field
             * 
             * @class
             */
            ObjectForm.NumberFlexField = function() {
                ObjectForm.FlexFieldBase.apply(this);

                this.value = new ko.observable(0.0);
            }

            ObjectForm.NumberFlexField.prototype = jQuery.extend(true, {}, ObjectForm.FlexFieldBase.prototype);

            /**
             * Returns the type of the field
             * 
             * @returns {int} Type of the field
             */
            ObjectForm.NumberFlexField.prototype.getType = function() { return ObjectForm.FlexFieldTypeNumber; }

            /**
             * Returns the template name
             * 
             * @returns {string} Template Name
             */
            ObjectForm.NumberFlexField.prototype.getTemplateName = function() { return "gn-numberField"; }

            /**
             * Returns if the field can be exported to a script
             * 
             * @returns {bool} true if the value can be exported to a script, else false
             */
            ObjectForm.NumberFlexField.prototype.canExportToScript = function() { return true; }

            /**
             * Serializes the value to a string
             * 
             * @returns {string} Value of the field as a string
             */
            ObjectForm.NumberFlexField.prototype.serializeValue = function() { return this.value() ? this.value().toString() : "0.0"; }

            /**
             * Deserializes a value from a string
             * 
             * @param {string} value Value to Deserialize
             */
            ObjectForm.NumberFlexField.prototype.deserializeValue = function(value) { 
                var parsedValue = parseFloat(value);
                if(!isNaN(parsedValue))
                {
                    this.value(parsedValue); 
                }
                else
                {
                    this.value(0.0);
                }
            }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Type of the object field
             */
            ObjectForm.FlexFieldTypeOption = 3;

            /**
             * Class for an option field
             * 
             * @class
             */
            ObjectForm.OptionFlexField = function() {
                ObjectForm.FlexFieldBase.apply(this);

                this.value = new ko.observable(null);
                this.options = new ko.observableArray();
            }

            ObjectForm.OptionFlexField.prototype = jQuery.extend(true, {}, ObjectForm.FlexFieldBase.prototype);

            /**
             * Returns the type of the field
             * 
             * @returns {int} Type of the field
             */
            ObjectForm.OptionFlexField.prototype.getType = function() { return ObjectForm.FlexFieldTypeOption; }

            /**
             * Returns the template name
             * 
             * @returns {string} Template Name
             */
            ObjectForm.OptionFlexField.prototype.getTemplateName = function() { return "gn-optionField"; }

            /**
             * Returns if the field can be exported to a script
             * 
             * @returns {bool} true if the value can be exported to a script, else false
             */
            ObjectForm.OptionFlexField.prototype.canExportToScript = function() { return true; }

            /**
             * Serializes the value to a string
             * 
             * @returns {string} Value of the field as a string
             */
            ObjectForm.OptionFlexField.prototype.serializeValue = function() { return this.value(); }

            /**
             * Deserializes a value from a string
             * 
             * @param {string} value Value to Deserialize
             */
            ObjectForm.OptionFlexField.prototype.deserializeValue = function(value) { this.value(value); }


            /**
             * Returns true if the field has additional configuration, else false
             * 
             * @returns {bool} true if the field has additional configuration, else false
             */
            ObjectForm.OptionFlexField.prototype.hasAdditionalConfiguration = function() { return true; }

            /**
             * Returns the label for additional configuration
             * 
             * @returns {string} Additional Configuration
             */
            ObjectForm.OptionFlexField.prototype.getAdditionalConfigurationLabel = function() { return GoNorth.FlexFieldDatabase.Localization.OptionFieldAdditionalConfigurationLabel; }

            /**
             * Returns true if the additional configuration can be edited for fields that were created based on template fields, else false
             * 
             * @returns {bool} true if the additional configuration can be edited for fields that were created based on template fields, else false
             */
            ObjectForm.OptionFlexField.prototype.allowEditingAdditionalConfigForTemplateFields = function() { return false; }

            /**
             * Sets additional configuration
             * 
             * @param {string} configuration Additional Configuration
             */
            ObjectForm.OptionFlexField.prototype.setAdditionalConfiguration = function(configuration) { 
                var availableOptions = [];
                if(configuration)
                {
                    availableOptions = configuration.split("\n");
                }
                
                this.options(availableOptions)
            }

            /**
             * Returns additional configuration
             * 
             * @returns {string} Additional Configuration
             */
            ObjectForm.OptionFlexField.prototype.getAdditionalConfiguration = function() { return this.options().join("\n"); }
        
            /**
             * Serializes the additional configuration
             * 
             * @returns {string} Serialized additional configuration
             */
            ObjectForm.OptionFlexField.prototype.serializeAdditionalConfiguration = function() { return JSON.stringify(this.options()); },

            /**
             * Deserializes the additional configuration
             * 
             * @param {string} additionalConfiguration Serialized additional configuration
             */
            ObjectForm.OptionFlexField.prototype.deserializeAdditionalConfiguration = function(additionalConfiguration) { 
                var options = [];
                if(additionalConfiguration)
                {
                    options = JSON.parse(additionalConfiguration);
                }

                this.options(options);
            }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Type of the field group
             */
            ObjectForm.FlexFieldGroup = 100;

            /**
             * Class for a field group
             * 
             * @class
             */
            ObjectForm.FieldGroup = function() {
                ObjectForm.FlexFieldBase.apply(this);

                this.fields = new ko.observableArray();
                this.deserializingFieldIds = null;

                this.isExpandedByDefault = true;
                this.areFieldsExpanded = new ko.observable(true);
            }

            ObjectForm.FieldGroup.prototype = jQuery.extend(true, {}, ObjectForm.FlexFieldBase.prototype);

            /**
             * Returns the type of the field
             * 
             * @returns {int} Type of the field
             */
            ObjectForm.FieldGroup.prototype.getType = function() { return ObjectForm.FlexFieldGroup; }

            /**
             * Returns the template name
             * 
             * @returns {string} Template Name
             */
            ObjectForm.FieldGroup.prototype.getTemplateName = function() { return "gn-fieldGroup"; }

            /**
             * Returns if the field can be exported to a script
             * 
             * @returns {bool} true if the value can be exported to a script, else false
             */
            ObjectForm.FieldGroup.prototype.canExportToScript = function() { return false; }

            /**
             * Serializes the value to a string
             * 
             * @param {number} fieldIndex Index of the field in the final serialization
             * @returns {string} Value of the field as a string
             */
            ObjectForm.FieldGroup.prototype.serializeValue = function(fieldIndex) { 
                var fieldIds = [];
                var fields = this.fields();
                for(var curField = 0; curField < fields.length; ++curField)
                {
                    // If field id is not yet filled it will be filled on the server side
                    if(fields[curField].id())
                    {
                        fieldIds.push(fields[curField].id());
                    }
                    else
                    {
                        fieldIds.push((fieldIndex + curField + 1).toString());
                    }
                }

                return JSON.stringify(fieldIds); 
            }
            
            /**
             * Returns all child fields
             * 
             * @returns {FlexFieldBase[]} Children of the field, null if no children exist
             */
            ObjectForm.FieldGroup.prototype.getChildFields = function() { 
                return this.fields(); 
            }

            /**
             * Deserializes a value from a string
             * 
             * @param {string} value Value to Deserialize
             */
            ObjectForm.FieldGroup.prototype.deserializeValue = function(value) { 
                this.deserializingFieldIds = [];
                if(value) 
                {
                    this.deserializingFieldIds = JSON.parse(value);
                }
            }

            /**
             * Serializes the additional configuration
             * 
             * @returns {string} Serialized additional configuration
             */
            ObjectForm.FieldGroup.prototype.serializeAdditionalConfiguration = function() { 
                return JSON.stringify({
                    isExpandedByDefault: this.isExpandedByDefault
                }); 
            },

            /**
             * Deserializes the additional configuration
             * 
             * @param {string} additionalConfiguration Serialized additional configuration
             */
            ObjectForm.FieldGroup.prototype.deserializeAdditionalConfiguration = function(additionalConfiguration) { 
                if(additionalConfiguration)
                {
                    var deserializedConfig = JSON.parse(additionalConfiguration);
                    this.isExpandedByDefault = deserializedConfig.isExpandedByDefault;
                    this.areFieldsExpanded(this.isExpandedByDefault);
                }
            }
            
            /**
             * Groups fields into the field
             * 
             * @param {FlexFieldBase[]} fields Root List of fields
             * @param {object} fieldsToRemoveFromRootList Object to track fields that must be removed from the root list
             */
            ObjectForm.FieldGroup.prototype.groupFields = function(fields, fieldsToRemoveFromRootList) { 
                if(!this.deserializingFieldIds)
                {
                    return;
                }

                for(var curGroupFieldId = 0; curGroupFieldId < this.deserializingFieldIds.length; ++curGroupFieldId)
                {
                    var fieldFound = false;
                    for(var curField = 0; curField < fields.length; ++curField)
                    {
                        if(fields[curField].id() == this.deserializingFieldIds[curGroupFieldId])
                        {
                            // Check fieldsToRemoveFromRootList here to prevent duplicated fields if a new group was distributed from template 
                            // using a field which a group in the current object includes
                            if(!fieldsToRemoveFromRootList[curField])
                            {
                                this.fields.push(fields[curField]);
                                fieldsToRemoveFromRootList[curField] = true;
                            }
                            fieldFound = true;
                            break;
                        }
                    }

                    // If a user creates a folder from template the index must be used
                    if(!fieldFound && this.deserializingFieldIds[curGroupFieldId] && this.deserializingFieldIds[curGroupFieldId].indexOf("-") < 0)
                    {
                        var targetIndex = parseInt(this.deserializingFieldIds[curGroupFieldId]);
                        if(!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < fields.length)
                        {
                            this.fields.push(fields[targetIndex]);
                            fieldsToRemoveFromRootList[targetIndex] = true;
                        }
                    }
                }
                this.deserializingFieldIds = null;
            }


            /**
             * Toggles the field visibility
             */
            ObjectForm.FieldGroup.prototype.toogleFieldVisibility = function() {
                this.areFieldsExpanded(!this.areFieldsExpanded());
            }

            /**
             * Deletes a field
             * 
             * @param {FlexFieldBase} field Field to delete
             */
            ObjectForm.FieldGroup.prototype.deleteField = function(field) {
                this.fields.remove(field);
            }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Class for managing flex fields
             * 
             * @class
             */
            ObjectForm.FlexFieldManager = function() {
                this.fields = new ko.observableArray();
            }

            ObjectForm.FlexFieldManager.prototype = {
                /**
                 * Adds a single line field to the manager
                 * 
                 * @param {string} name Name of the field
                 */
                addSingleLineField: function(name) {
                    return this.addField(ObjectForm.FlexFieldTypeSingleLine, name);
                },

                /**
                 * Adds a multi line field to the manager
                 * 
                 * @param {string} name Name of the field
                 * @returns {FlexFieldBase} New field
                 */
                addMultiLineField: function(name) {
                    return this.addField(ObjectForm.FlexFieldTypeMultiLine, name);
                },

                /**
                 * Adds a number field to the manager
                 * 
                 * @param {string} name Name of the field
                 * @returns {FlexFieldBase} New field
                 */
                addNumberField: function(name) {
                    return this.addField(ObjectForm.FlexFieldTypeNumber, name);
                },
                
                /**
                 * Adds a option field to the manager
                 * 
                 * @param {string} name Name of the field
                 * @returns {FlexFieldBase} New field
                 */
                addOptionField: function(name) {
                    return this.addField(ObjectForm.FlexFieldTypeOption, name);
                },

                /**
                 * Adds a field group to the manager
                 * 
                 * @param {string} name Name of the group
                 * @returns {FlexFieldBase} New field
                 */
                addFieldGroup: function(name) {
                    return this.addField(ObjectForm.FlexFieldGroup, name);
                },

                /**
                 * Adds a field to the manager
                 * 
                 * @param {int} fieldType Type of the field
                 * @param {string} name Name of the field
                 * @returns {FlexFieldBase} New field
                 */
                addField: function(fieldType, name) {
                    var field = this.resolveFieldByType(fieldType);
                    if(!field)
                    {
                        throw "Unknown field type";
                    }

                    field.name(name);
                    this.fields.push(field);
                    return field;
                },

                /**
                 * Resolves a field by a type
                 * 
                 * @param {int} fieldType Field Type
                 */
                resolveFieldByType: function(fieldType) {
                    switch(fieldType)
                    {
                    case ObjectForm.FlexFieldTypeSingleLine:
                        return new ObjectForm.SingleLineFlexField();
                    case ObjectForm.FlexFieldTypeMultiLine:
                        return new ObjectForm.MultiLineFlexField();
                    case ObjectForm.FlexFieldTypeNumber:
                        return new ObjectForm.NumberFlexField();
                    case ObjectForm.FlexFieldTypeOption:
                        return new ObjectForm.OptionFlexField();
                    case ObjectForm.FlexFieldGroup:
                        return new ObjectForm.FieldGroup();
                    }

                    return null;
                },


                /**
                 * Deletes a field
                 * 
                 * @param {FlexFieldBase} field Field to delete
                 */
                deleteField: function(field) {
                    this.fields.remove(field);
                },

                /**
                 * Deletes a field group
                 * 
                 * @param {FieldGroup} fieldGroup Field group to delete
                 */
                deleteFieldGroup: function(field) {
                    if(field.fields) {
                        var targetPushIndex = this.fields.indexOf(field);
                        var fieldsInGroup = field.fields();
                        for(var curField = 0; curField < fieldsInGroup.length; ++curField)
                        {
                            if(targetPushIndex < 0)
                            {
                                this.fields.push(fieldsInGroup[curField]);
                            }
                            else
                            {
                                this.fields.splice(targetPushIndex + curField, 0, fieldsInGroup[curField]);
                            }
                        }
                    }
                    
                    this.fields.remove(field);
                },


                /**
                 * Serializes the fields to an array with values
                 * 
                 * @returns {object[]} Serialized values
                 */
                serializeFields: function() {
                    var serializedValues = [];
                    var fields = this.fields();
                    for(var curField = 0; curField < fields.length; ++curField)
                    {
                        serializedValues.push(this.serializeSingleField(fields[curField], serializedValues));

                        var childFields = fields[curField].getChildFields();
                        if(childFields)
                        {
                            for(var curChild = 0; curChild < childFields.length; ++curChild)
                            {
                                serializedValues.push(this.serializeSingleField(childFields[curChild], serializedValues));
                            }
                        }
                    }

                    return serializedValues;
                },

                /**
                 * Serializes a single field
                 * 
                 * @param {FlexFieldBase} field Field to serialize
                 * @param {object[]} serializedValues Already serialized values
                 * @returns {object} Serialized field
                 */
                serializeSingleField: function(field, serializedValues) {
                    return {
                        id: field.id(),
                        createdFromTemplate: field.createdFromTemplate(),
                        fieldType: field.getType(),
                        name: field.name(),
                        value: field.serializeValue(serializedValues.length),
                        additionalConfiguration: field.serializeAdditionalConfiguration(),
                        scriptSettings: field.scriptSettings.serialize()
                    };
                },

                /**
                 * Deserializes saved fields fields
                 * 
                 * @param {objec[]} serializedValues Serialized values 
                 */
                deserializeFields: function(serializedValues) {
                    var fields = [];
                    for(var curField = 0; curField < serializedValues.length; ++curField)
                    {
                        var deserializedField = this.resolveFieldByType(serializedValues[curField].fieldType);
                        deserializedField.id(serializedValues[curField].id);
                        deserializedField.createdFromTemplate(serializedValues[curField].createdFromTemplate);
                        deserializedField.name(serializedValues[curField].name);
                        deserializedField.deserializeValue(serializedValues[curField].value);
                        deserializedField.deserializeAdditionalConfiguration(serializedValues[curField].additionalConfiguration);
                        deserializedField.scriptSettings.deserialize(serializedValues[curField].scriptSettings);
                        fields.push(deserializedField);
                    }

                    var fieldsToRemoveFromRootList = {};
                    for(var curField = 0; curField < fields.length; ++curField)
                    {
                        fields[curField].groupFields(fields, fieldsToRemoveFromRootList);
                    }

                    for(var curField = fields.length - 1; curField >= 0; --curField)
                    {
                        if(fieldsToRemoveFromRootList[curField])
                        {
                            fields.splice(curField, 1);
                        }
                    }

                    this.fields(fields);
                },

                /**
                 * Syncs the field ids back after save
                 * 
                 * @param {object} flexFieldObjectData Response flex field object data after save
                 */
                syncFieldIds: function(flexFieldObjectData) {
                    var fieldLookup = {};
                    for(var curField = 0; curField < flexFieldObjectData.fields.length; ++curField)
                    {
                        fieldLookup[flexFieldObjectData.fields[curField].name] = flexFieldObjectData.fields[curField].id;
                    }

                    var fields = this.fields();
                    for(var curField = 0; curField < fields.length; ++curField)
                    {
                        fields[curField].id(fieldLookup[fields[curField].name()]);
                    }
                },

                /**
                 * Flags all fields as created from template
                 */
                flagFieldsAsCreatedFromTemplate: function() {
                    var fields = this.fields();
                    for(var curField = 0; curField < fields.length; ++curField)
                    {
                        fields[curField].createdFromTemplate(true);
                        var children = fields[curField].getChildFields();
                        if(!children)
                        {
                            continue;
                        }

                        for(var curChild = 0; curChild < children.length; ++curChild)
                        {
                            children[curChild].createdFromTemplate(true);
                        }
                    }
                },


                /**
                 * Checks if a field name is in used
                 * 
                 * @param {string} fieldName Name of the field to check
                 * @param {string} fieldToIgnore Field to ignore during the check (important for rename)
                 */
                isFieldNameInUse: function(fieldName, fieldToIgnore) {
                    fieldName = fieldName.toLowerCase();

                    var fields = this.fields();
                    for(var curField = 0; curField < fields.length; ++curField)
                    {
                        if(fields[curField] != fieldToIgnore && fields[curField].name() && fields[curField].name().toLowerCase() == fieldName)
                        {
                            return true;
                        }

                        var children = fields[curField].getChildFields();
                        if(!children)
                        {
                            continue;
                        }

                        for(var curChild = 0; curChild < children.length; ++curChild)
                        {
                            if(children[curChild] != fieldToIgnore && children[curChild].name() && children[curChild].name().toLowerCase() == fieldName)
                            {
                                return true;
                            }
                        }
                    }
                }
            }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /// Script Type value for a non existing script
            var scriptTypeNone = -1;

            /**
             * Class that allows the user to manage export snippets
             * @param {string} objectType Object Type Name
             * @param {ko.observable} isImplementedObs Observable to show if the object is implemented
             * @class
             */
            ObjectForm.ExportSnippetManager = function(objectType, isImplementedObs) {
                this.objectType = objectType;
                this.isImplementedObs = isImplementedObs;

                this.chooseObjectDialog = new GoNorth.ChooseObjectDialog.ViewModel();

                this.showSnippetManagerDialog = new ko.observable(false);

                this.objectId = new ko.observable("");

                this.validSnippets = new ko.observableArray();
                this.invalidSnippets = new ko.observableArray();

                this.snippetManagerDialogLoading = new ko.observable(false);
                this.snippetManagerDialogErrorOccured = new ko.observable(false);
                               
                this.chooseScriptTypeDialog = new GoNorth.Shared.ChooseScriptTypeDialog.ViewModel();
                this.codeScriptDialog = new GoNorth.ScriptDialog.CodeScriptDialog(this.errorOccured);
                this.nodeScriptDialog = new GoNorth.ScriptDialog.NodeScriptDialog(this.objectId, this.chooseObjectDialog, this.codeScriptDialog, this.snippetManagerDialogErrorOccured);

                this.showConfirmDeleteDialog = new ko.observable(false);
                this.snippetToDelete = null;
            }

            ObjectForm.ExportSnippetManager.prototype = {
                /**
                 * Opens the snippet manager dialog
                 * 
                 * @param {string} id Id of the object
                 * @param {number} templateType Template type
                 */
                openSnippetManagerDialog: function(id, templateType) {
                    this.objectId(id);

                    this.validSnippets.removeAll();
                    this.invalidSnippets.removeAll();

                    this.showSnippetManagerDialog(true);

                    this.loadSnippets(id, templateType);
                },

                /**
                 * Closes the snippet manager dialog
                 */
                closeSnippetManagerDialog: function(id, templateType) {
                    this.showSnippetManagerDialog(false);
                },

                /**
                 * Loads the snippets for the object
                 * 
                 * @param {string} id Id of the object
                 * @param {number} templateType Template type
                 */
                loadSnippets: function(id, templateType) {
                    this.snippetManagerDialogLoading(true);
                    this.snippetManagerDialogErrorOccured(false);
                    var availableSnippets = null;
                    var existingSnippets = null;

                    var templateSnippetsDef = jQuery.ajax({ 
                        url: "/api/ExportApi/GetExportTemplateSnippetsByObjectId?id=" + id + "&templateType=" + templateType, 
                        type: "GET"
                    });
                    templateSnippetsDef.done(function(data) {
                        availableSnippets = data;
                    })

                    var existingSnippetsDef = jQuery.ajax({ 
                        url: "/api/ExportApi/GetFilledExportTemplateSnippetsByObjectId?id=" + id, 
                        type: "GET"
                    });
                    existingSnippetsDef.done(function(data) {
                        existingSnippets = data;
                    })

                    var self = this;
                    jQuery.when(templateSnippetsDef, existingSnippetsDef).done(function() {
                        self.mergeSnippets(availableSnippets, existingSnippets);

                        self.snippetManagerDialogLoading(false);
                    }).fail(function(xhr) {
                        self.snippetManagerDialogLoading(false);
                        self.snippetManagerDialogErrorOccured(true);
                    });
                },


                /**
                 * Merges the available snippets and the existing snippets
                 * @param {object[]} availableSnippets Available snippets
                 * @param {object[]} existingSnippets Existing Snippets
                 */
                mergeSnippets: function(availableSnippets, existingSnippets) {
                    var availableSnippetsLookup = {};
                    for(var curSnippet = 0; curSnippet < availableSnippets.length; ++curSnippet)
                    {
                        availableSnippetsLookup[availableSnippets[curSnippet].name.toLowerCase()] = availableSnippets[curSnippet];
                    }

                    for(var curSnippet = 0; curSnippet < existingSnippets.length; ++curSnippet)
                    {
                        var snippetObject = this.createSnippetObject(existingSnippets[curSnippet].snippetName);
                        snippetObject.id = existingSnippets[curSnippet].id;
                        snippetObject.scriptName(existingSnippets[curSnippet].scriptName);
                        snippetObject.scriptType = existingSnippets[curSnippet].scriptType;
                        snippetObject.scriptNodeGraph = existingSnippets[curSnippet].scriptNodeGraph;
                        snippetObject.scriptCode = existingSnippets[curSnippet].scriptCode;

                        if(availableSnippetsLookup[snippetObject.snippetName.toLowerCase()])
                        {
                            availableSnippetsLookup[snippetObject.snippetName.toLowerCase()].wasUsed = true;
                            this.validSnippets.push(snippetObject);
                        }
                        else
                        {
                            this.invalidSnippets.push(snippetObject);
                        }
                    }

                    for(var curSnippet = 0; curSnippet < availableSnippets.length; ++curSnippet)
                    {
                        if(!availableSnippetsLookup[availableSnippets[curSnippet].name.toLowerCase()].wasUsed)
                        {
                            this.validSnippets.push(this.createSnippetObject(availableSnippets[curSnippet].name));
                        }
                    }
                },

                /**
                 * Creates a snippet object
                 * @param {string} snippetName Name of the snippet
                 * @returns {object} Snippet Object
                 */
                createSnippetObject: function(snippetName) {
                    return {
                        id: "",
                        objectId: this.objectId(),
                        snippetName: snippetName,
                        scriptName: new ko.observable(""),
                        scriptType: scriptTypeNone,
                        scriptNodeGraph: null,
                        scriptCode: null,
                    }
                },


                /**
                 * Creates or updates a snippet
                 * @param {object} snippet Snippet to create or update
                 */
                createUpdateSnippet: function(snippet) {
                    var self = this;
                    if(snippet.scriptType == scriptTypeNone)
                    {
                        this.chooseScriptTypeDialog.openDialog().done(function(selectedType) {
                            if(selectedType == GoNorth.Shared.ChooseScriptTypeDialog.nodeGraph)
                            {
                                self.nodeScriptDialog.openCreateDialog().done(function(result) {
                                    snippet.scriptName(result.name);
                                    snippet.scriptType = GoNorth.Shared.ChooseScriptTypeDialog.nodeGraph;
                                    snippet.scriptNodeGraph = result.graph;
                                    snippet.scriptCode = null;

                                    self.saveSnippet(snippet);
                                });
                            }
                            else if(selectedType == GoNorth.Shared.ChooseScriptTypeDialog.codeScript)
                            {
                                self.codeScriptDialog.openCreateDialog().done(function(result) {
                                    snippet.scriptName(result.name);
                                    snippet.scriptType = GoNorth.Shared.ChooseScriptTypeDialog.codeScript;
                                    snippet.scriptNodeGraph = null;
                                    snippet.scriptCode = result.code;

                                    self.saveSnippet(snippet);
                                });
                            }
                        });
                    }
                    else if(snippet.scriptType == GoNorth.Shared.ChooseScriptTypeDialog.nodeGraph)
                    {
                        this.nodeScriptDialog.openEditDialog(snippet.scriptName(), snippet.scriptNodeGraph).done(function(result) {
                            snippet.scriptName(result.name);
                            snippet.scriptNodeGraph = result.graph;

                            self.saveSnippet(snippet);
                        });
                    }
                    else if(snippet.scriptType == GoNorth.Shared.ChooseScriptTypeDialog.codeScript)
                    {
                        this.codeScriptDialog.openEditDialog(snippet.scriptName(), snippet.scriptCode).done(function(result) {
                            snippet.scriptName(result.name);
                            snippet.scriptCode = result.code;
                            
                            self.saveSnippet(snippet);
                        });
                    }
                },

                /**
                 * Saves a snippet
                 * @param {object} snippet Snippet to save
                 */
                saveSnippet: function(snippet) {
                    var url = "/api/ExportApi/CreateObjectExportSnippet?objectType=" + this.objectType;
                    if(snippet.id) 
                    {
                        url = "/api/ExportApi/UpdateObjectExportSnippet?id=" + snippet.id + "&objectType=" + this.objectType;
                    }

                    var requestData = {
                        id: snippet.id,
                        objectId: snippet.objectId,
                        snippetName: snippet.snippetName,
                        scriptName: snippet.scriptName(),
                        scriptType: snippet.scriptType,
                        scriptNodeGraph: snippet.scriptNodeGraph,
                        scriptCode: snippet.scriptCode
                    }

                    this.snippetManagerDialogLoading(false);
                    this.snippetManagerDialogErrorOccured(false);
                    var self = this;
                    jQuery.ajax({ 
                        url: url, 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify(requestData), 
                        type: "POST",
                        contentType: "application/json"
                    }).done(function(result) {
                        self.snippetManagerDialogLoading(false);
                        
                        if(!snippet.id) 
                        {
                            snippet.id = result.id;
                        }

                        if(!result.isImplemented)
                        {
                            self.isImplementedObs(false);
                        }
                    }).fail(function() {
                        self.snippetManagerDialogLoading(false);
                        self.snippetManagerDialogErrorOccured(true);
                    });
                },


                /**
                 * Opens the confirm dialog to delete a snippet
                 * @param {object} snippet Snippet to delete
                 */
                openDeleteSnippetDialog: function(snippet) {
                    this.showConfirmDeleteDialog(true);
                    this.snippetToDelete = snippet;
                },

                /**
                 * Opens the confirm dialog to delete a snippet
                 * @param {object} snippet Snippet to delete
                 */
                deleteSnippet: function() {
                    if(!this.snippetToDelete)
                    {
                        return;
                    }

                    this.showConfirmDeleteDialog(false);

                    this.snippetManagerDialogLoading(false);
                    this.snippetManagerDialogErrorOccured(false);
                    var self = this;
                    jQuery.ajax({ 
                        url: "/api/ExportApi/DeleteObjectExportSnippet?id=" + this.snippetToDelete.id + "&objectType=" + this.objectType, 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        type: "DELETE",
                        contentType: "application/json"
                    }).done(function(result) {
                        self.snippetManagerDialogLoading(false);

                        self.resetSnippet(self.snippetToDelete);
                        self.invalidSnippets.remove(self.snippetToDelete);
                        self.snippetToDelete = null;
                        
                        if(!result.isImplemented)
                        {
                            self.isImplementedObs(false);
                        }
                    }).fail(function() {
                        self.snippetManagerDialogLoading(false);
                        self.snippetManagerDialogErrorOccured(true);
                        self.snippetToDelete = null;
                    });
                },

                /**
                 * Resets a snippet to its initial state
                 * @param {object} snippet Snippet to reset
                 */
                resetSnippet: function(snippet) {
                    snippet.id = "";
                    snippet.objectId = this.objectId();
                    snippet.scriptName("");
                    snippet.scriptType = scriptTypeNone;
                    snippet.scriptNodeGraph = null;
                    snippet.scriptCode = null;
                },

                /**
                 * Cancels the confirm delete snippet dialog
                 */
                cancelDeleteSnippetDialog: function() {
                    this.showConfirmDeleteDialog(false);
                    this.snippetToDelete = null;
                }
            }

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Flex Field Handling Viewmodel with pure field handling
             * @class
             */
            ObjectForm.FlexFieldHandlingViewModel = function()
            {
                this.fieldManager = new GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldManager();

                this.showFieldCreateEditDialog = new ko.observable(false);
                this.isEditingField = new ko.observable(false);
                this.fieldToEdit = null;
                this.createEditFieldName = new ko.observable("");
                this.createEditFieldAdditionalConfigurationDisabled = new ko.observable(false);
                this.createEditFieldHasAdditionalConfiguration = new ko.observable(false);
                this.createEditFieldAdditionalConfiguration = new ko.observable("");
                this.createEditFieldAdditionalConfigurationLabel = new ko.observable("");
                this.createEditFieldDeferred = null;

                this.showConfirmFieldDeleteDialog = new ko.observable(false);
                this.fieldToDelete = null;
                this.fieldToDeleteParent = null;

                this.showFieldScriptSettingsDialog = new ko.observable(false);
                this.dontExportFieldToScript = new ko.observable();
                this.additionalFieldScriptNames = new ko.observable();
                this.scriptSettingsField = null;

                this.showFieldGroupCreateEditDialog = new ko.observable(false);
                this.fieldGroupToEdit = null;
                this.isEditingFieldGroup = new ko.observable(false);
                this.createEditFieldGroupName = new ko.observable("");
                this.createEditFieldGroupExpandedByDefault = new ko.observable(false);

                this.showDuplicateFieldNameError = new ko.observable(false);

                var self = this;
                this.createEditFieldName.subscribe(function() {
                    self.showDuplicateFieldNameError(false);
                });
                this.createEditFieldGroupName.subscribe(function() {
                    self.showDuplicateFieldNameError(false);
                });
                
                this.showConfirmFieldGroupDeleteDialog = new ko.observable(false);
                this.fieldGroupToDelete = null;
            };

            ObjectForm.FlexFieldHandlingViewModel.prototype = {
                /**
                 * Function gets called after a new field was added
                 */
                onFieldAdded: function() {

                },

                /**
                 * Adds a single line field to the object
                 */
                addSingleLineField: function() {
                    var self = this;
                    this.openCreateEditFieldDialog(false, "").done(function(name) {
                        self.fieldManager.addSingleLineField(name);
                        self.onFieldAdded();
                    });
                },

                /**
                 * Adds a multi line field to the object
                 */
                addMultiLineField: function() {
                    var self = this;
                    this.openCreateEditFieldDialog(false, "").done(function(name) {
                        self.fieldManager.addMultiLineField(name);
                        self.onFieldAdded();
                    });
                },

                /**
                 * Adds a number field to the object
                 */
                addNumberField: function() {
                    var self = this;
                    this.openCreateEditFieldDialog(false, "").done(function(name) {
                        self.fieldManager.addNumberField(name);
                        self.onFieldAdded();
                    });
                },

                /**
                 * Adds an option field to the object
                 */
                addOptionField: function() {
                    var self = this;
                    this.openCreateEditFieldDialog(false, "", true, "", GoNorth.FlexFieldDatabase.Localization.OptionFieldAdditionalConfigurationLabel, false).done(function(name, additionalConfiguration) {
                        var optionField = self.fieldManager.addOptionField(name);
                        optionField.setAdditionalConfiguration(additionalConfiguration);
                        self.onFieldAdded();
                    });
                },


                /**
                 * Edits a field
                 * 
                 * @param {FlexFieldBase} field Object Field
                 */
                editField: function(field) {
                    var disableAdditionalConfig = !field.allowEditingAdditionalConfigForTemplateFields() && field.createdFromTemplate();
                    this.openCreateEditFieldDialog(true, field, field.hasAdditionalConfiguration(), field.getAdditionalConfiguration(), field.getAdditionalConfigurationLabel(), disableAdditionalConfig).done(function(name, additionalConfiguration) {
                        field.name(name);

                        if(field.hasAdditionalConfiguration())
                        {
                            field.setAdditionalConfiguration(additionalConfiguration);
                        }
                    });
                },


                /**
                 * Opens the create/edit field dialog
                 * 
                 * @param {bool} isEdit true if its an edit operation, else false
                 * @param {FlexFieldBase} fieldToEdit Field to edit
                 * @param {bool} hasAdditionalConfiguration true if additional configuration is required for the field
                 * @param {string} existingAdditionalConfiguration Existing additional Configuration
                 * @param {string} additionalConfigurationLabel Label for the additional configuration
                 * @param {bool} disableAdditionalConfiguration true if the additional configuration should be disabled, else false
                 * @returns {jQuery.Deferred} Deferred which will be resolved once the user presses save
                 */
                openCreateEditFieldDialog: function(isEdit, fieldToEdit, hasAdditionalConfiguration, existingAdditionalConfiguration, additionalConfigurationLabel, disableAdditionalConfiguration) {
                    this.createEditFieldDeferred = new jQuery.Deferred();

                    this.isEditingField(isEdit);
                    if(fieldToEdit)
                    {
                        this.createEditFieldName(fieldToEdit.name());
                        this.fieldToEdit = fieldToEdit;
                    }
                    else
                    {
                        this.createEditFieldName("");
                        this.fieldToEdit = null;
                    }

                    this.createEditFieldHasAdditionalConfiguration(hasAdditionalConfiguration ? true : false);
                    if(hasAdditionalConfiguration)
                    {
                        this.createEditFieldAdditionalConfigurationDisabled(disableAdditionalConfiguration)
                        this.createEditFieldAdditionalConfigurationLabel(additionalConfigurationLabel);
                        this.createEditFieldAdditionalConfiguration(existingAdditionalConfiguration ? existingAdditionalConfiguration : "");
                    }

                    GoNorth.Util.setupValidation("#gn-fieldCreateEditForm");
                    this.showFieldCreateEditDialog(true);

                    return this.createEditFieldDeferred.promise();
                },

                /**
                 * Saves the field
                 */
                saveField: function() {
                    if(!jQuery("#gn-fieldCreateEditForm").valid())
                    {
                        return;
                    }

                    if(this.fieldManager.isFieldNameInUse(this.createEditFieldName(), this.fieldToEdit))
                    {
                        this.showDuplicateFieldNameError(true);
                        return;
                    }

                    if(this.createEditFieldDeferred)
                    {
                        var additionalConfiguration = null;
                        if(this.createEditFieldHasAdditionalConfiguration())
                        {
                            additionalConfiguration = this.createEditFieldAdditionalConfiguration();
                        }
                        this.createEditFieldDeferred.resolve(this.createEditFieldName(), additionalConfiguration);
                    }
                    this.createEditFieldDeferred = null;
                    this.showFieldCreateEditDialog(false);
                },

                /**
                 * Cancels the field dialog
                 */
                cancelFieldDialog: function() {
                    if(this.createEditFieldDeferred)
                    {
                        this.createEditFieldDeferred.reject();
                    }
                    this.createEditFieldDeferred = null; 
                    this.fieldToEdit = null;
                    this.showFieldCreateEditDialog(false);
                },


                /**
                 * Opens the create new field group dialog
                 */
                openCreateNewFieldGroupDialog: function() {
                    GoNorth.Util.setupValidation("#gn-fieldGroupCreateEditForm");
                    this.showFieldGroupCreateEditDialog(true);
                    this.fieldGroupToEdit = null;
                    this.isEditingFieldGroup(false);
                    this.createEditFieldGroupName("");
                    this.createEditFieldGroupExpandedByDefault(true);
                },

                /**
                 * Opens the edit field group dialog
                 * 
                 * @param {FieldGroup} fieldGroupToEdit Field group to edit
                 */
                openEditFieldGroupDialog: function(fieldGroupToEdit) {
                    GoNorth.Util.setupValidation("#gn-fieldGroupCreateEditForm");
                    this.showFieldGroupCreateEditDialog(true);
                    this.fieldGroupToEdit = fieldGroupToEdit;
                    this.isEditingFieldGroup(true);
                    this.createEditFieldGroupName(fieldGroupToEdit.name());
                    this.createEditFieldGroupExpandedByDefault(fieldGroupToEdit.isExpandedByDefault);
                },

                /**
                 * Saves the field group
                 */
                saveFieldGroup: function() {
                    if(!jQuery("#gn-fieldGroupCreateEditForm").valid())
                    {
                        return;
                    }

                    if(this.fieldManager.isFieldNameInUse(this.createEditFieldGroupName(), this.fieldGroupToEdit))
                    {
                        this.showDuplicateFieldNameError(true);
                        return;
                    }

                    if(this.fieldGroupToEdit == null)
                    {
                        var fieldGroup = this.fieldManager.addFieldGroup(this.createEditFieldGroupName());
                        fieldGroup.isExpandedByDefault = this.createEditFieldGroupExpandedByDefault();
                        fieldGroup.areFieldsExpanded(fieldGroup.isExpandedByDefault);
                    }
                    else
                    {
                        this.fieldGroupToEdit.name(this.createEditFieldGroupName());
                        this.fieldGroupToEdit.isExpandedByDefault = this.createEditFieldGroupExpandedByDefault();
                        this.fieldGroupToEdit.areFieldsExpanded(this.fieldGroupToEdit.isExpandedByDefault);
                    }
                    this.closeFieldGroupDialog();
                },

                /**
                 * Closes the field group dialog
                 */
                closeFieldGroupDialog: function() {
                    this.fieldGroupToEdit = null;
                    this.showFieldGroupCreateEditDialog(false);
                },

                /**
                 * Opens the confirm delete field group dialog
                 * 
                 * @param {FieldGroup} fieldGroup Field group to delete
                 */
                openConfirmDeleteFieldGroupDialog: function(fieldGroup) {
                    this.showConfirmFieldGroupDeleteDialog(true);
                    this.fieldGroupToDelete = fieldGroup;
                },

                /**
                 * Closes the confirm field group delete dialog
                 */
                closeConfirmFieldGroupDeleteDialog: function() {
                    this.showConfirmFieldGroupDeleteDialog(false);
                    this.fieldGroupToDelete = null;
                },

                /**
                 * Deletes the current field group
                 */
                deleteFieldGroup: function() {
                    this.fieldManager.deleteFieldGroup(this.fieldGroupToDelete);
                    this.closeConfirmFieldGroupDeleteDialog();
                },

                /**
                 * Checks if a field drop is allowed
                 * 
                 * @param {object} dropEvent Drop event 
                 */
                checkFieldDropAllowed: function(dropEvent) {
                    if(dropEvent.item.getType() == ObjectForm.FlexFieldGroup && dropEvent.targetParent != this.fieldManager.fields) {
                        dropEvent.cancelDrop = true;
                    }
                },


                /**
                 * Opens the delete field dialog
                 * 
                 * @param {FlexFieldBase} field Field to delete
                 * @param {object} fieldParent Field parent
                 */
                openConfirmDeleteFieldDialog: function(field, fieldParent) {
                    this.showConfirmFieldDeleteDialog(true);
                    this.fieldToDelete = field;
                    this.fieldToDeleteParent = fieldParent;
                },

                /**
                 * Closes the confirm field delete dialog
                 */
                closeConfirmFieldDeleteDialog: function() {
                    this.showConfirmFieldDeleteDialog(false);
                    this.fieldToDelete = null;
                    this.fieldToDeleteParent = null;
                },

                /**
                 * Deletes the field for which the dialog is opened
                 */
                deleteField: function() {
                    if(this.fieldToDeleteParent != null && typeof(this.fieldToDeleteParent.getType) == "function" && this.fieldToDeleteParent.getType() == ObjectForm.FlexFieldGroup)
                    {
                        this.fieldToDeleteParent.deleteField(this.fieldToDelete);
                    }
                    else
                    {
                        this.fieldManager.deleteField(this.fieldToDelete);
                    }

                    this.closeConfirmFieldDeleteDialog();
                },


                /**
                 * Opens the script settings for a field
                 * 
                 * @param {FlexFieldBase} field Field for which the settings should be opened
                 */
                openScriptSettings: function(field) {
                    this.showFieldScriptSettingsDialog(true);
                    this.dontExportFieldToScript(field.scriptSettings.dontExportToScript);
                    this.additionalFieldScriptNames(field.scriptSettings.additionalScriptNames);
                    this.scriptSettingsField = field;
                },

                /**
                 * Saves the field script settings
                 */
                saveFieldScriptSettings: function() {
                    this.scriptSettingsField.scriptSettings.dontExportToScript = this.dontExportFieldToScript();
                    this.scriptSettingsField.scriptSettings.additionalScriptNames = this.additionalFieldScriptNames();
                    this.closeFieldScriptSettingsDialog();
                },

                /**
                 * Closes the field script settings dialog
                 */
                closeFieldScriptSettingsDialog: function() {
                    this.showFieldScriptSettingsDialog(false);
                    this.scriptSettingsField = null;
                }
            };

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(FlexFieldDatabase) {
        (function(ObjectForm) {

            /**
             * Object Form Base View Model
             * @param {string} rootPage Root Page
             * @param {string} apiControllerName Api Controller name
             * @param {string} objectType Object Type Name
             * @param {string} lockName Name of the resource used for the lock for an object of this type
             * @param {string} templateLockName Name of the resource used for the lock for a template of this type
             * @param {string} kirjaApiMentionedMethod Method of the kirja api which is used to load the pages in which the object is mentioned
             * @param {string} kartaApiMentionedMethod Method of the karta api which is used to load the maps in which the object is mentioned
             * @class
             */
            ObjectForm.BaseViewModel = function(rootPage, apiControllerName, objectType, lockName, templateLockName, kirjaApiMentionedMethod, kartaApiMarkedMethod)
            {
                GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldHandlingViewModel.apply(this);

                this.rootPage = rootPage;
                this.apiControllerName = apiControllerName;

                this.lockName = lockName;
                this.templateLockName = templateLockName;

                this.kirjaApiMentionedMethod = kirjaApiMentionedMethod;
                this.kartaApiMarkedMethod = kartaApiMarkedMethod;

                this.isTemplateMode = new ko.observable(false);
                if(GoNorth.Util.getParameterFromUrl("template"))
                {
                    this.isTemplateMode(true);
                }

                this.id = new ko.observable("");
                var paramId = GoNorth.Util.getParameterFromUrl("id");
                if(paramId)
                {
                    this.id(paramId);
                }

                this.objectImageUploadUrl = new ko.computed(function() {
                    if(this.isTemplateMode())
                    {
                        return "/api/" + this.apiControllerName + "/FlexFieldTemplateImageUpload?id=" + this.id();
                    }
                    else
                    {
                        return "/api/" + this.apiControllerName + "/FlexFieldImageUpload?id=" + this.id();
                    }
                }, this);

                var templateId = GoNorth.Util.getParameterFromUrl("templateId");
                this.templateId = templateId;
                this.parentFolderId = GoNorth.Util.getParameterFromUrl("folderId");
                
                this.isReadonly = new ko.observable(false);
                this.lockedByUser = new ko.observable("");

                this.isLoading = new ko.observable(false);

                this.isImplemented = new ko.observable(false);
                this.compareDialog = new GoNorth.ImplementationStatus.CompareDialog.ViewModel();

                this.objectName = new ko.observable("");
                this.imageFilename = new ko.observable("");
                this.thumbnailImageFilename = new ko.observable("");
                this.objectTags = new ko.observableArray();
                this.existingObjectTags = new ko.observableArray();

                this.objectNameDisplay = new ko.computed(function() {
                    var name = this.objectName();
                    if(name)
                    {
                        return " - " + name;
                    }

                    return "";
                }, this);

                this.showConfirmObjectDeleteDialog = new ko.observable(false);
                this.showCustomizedExportTemplateWarningOnDelete = new ko.observable(false);

                this.showConfirmRegenerateLanguageKeysDialog = new ko.observable(false);

                this.showConfirmExportDirtyStateDialog = new ko.observable(false);
                this.showConfirmExportDirtyStatePromise = null;
                this.showExportResultDialog = new ko.observable(false);
                this.exportResultContent = new ko.observable("");
                this.exportResultErrors = new ko.observableArray();
                this.exportResultFormat = "";
                this.exportShowSuccessfullyCopiedTooltip = new ko.observable(false);

                this.referencedInQuests = new ko.observableArray();
                this.loadingReferencedInQuests = new ko.observable(false);
                this.errorLoadingReferencedInQuests = new ko.observable(false);

                this.mentionedInKirjaPages = new ko.observableArray();
                this.loadingMentionedInKirjaPages = new ko.observable(false);
                this.errorLoadingMentionedInKirjaPages = new ko.observable(false);

                this.markedInKartaMaps = new ko.observableArray();
                this.loadingMarkedInKartaMaps = new ko.observable(false);
                this.errorLoadingMarkedInKartaMaps = new ko.observable(false);

                this.referencedInTaleDialogs = new ko.observableArray();
                this.loadingReferencedInTaleDialogs = new ko.observable(false);
                this.errorLoadingReferencedInTaleDialogs = new ko.observable(false);
                
                this.referencedInDailyRoutines = new ko.observableArray();
                this.loadingReferencedInDailyRoutines = new ko.observable(false);
                this.errorLoadingReferencedInDailyRoutines = new ko.observable(false);
                
                this.exportSnippetManager = new ObjectForm.ExportSnippetManager(objectType, this.isImplemented);

                this.errorOccured = new ko.observable(false);
                this.additionalErrorDetails = new ko.observable("");
                this.objectNotFound = new ko.observable(false);

                this.lastSavedObjectState = null;

                GoNorth.Util.setupValidation("#gn-objectFields");

                if(this.id() && this.isTemplateMode())
                {
                    this.checkIfCustomizedExportTemplateExists();
                }
            };

            
            ObjectForm.BaseViewModel.prototype = jQuery.extend({ }, GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldHandlingViewModel.prototype);

            /**
             * Loads additional dependencies
             */
            ObjectForm.BaseViewModel.prototype.loadAdditionalDependencies = function() {

            };

            /**
             * Parses additional data from a loaded object
             * 
             * @param {object} data Data returned from the webservice
             */
            ObjectForm.BaseViewModel.prototype.parseAdditionalData = function(data) {

            };

            /**
             * Sets Additional save data
             * 
             * @param {object} data Save data
             * @returns {object} Save data with additional values
             */
            ObjectForm.BaseViewModel.prototype.setAdditionalSaveData = function(data) {
                return data;
            };



            /**
             * Initializes the form, called by implementations
             */
            ObjectForm.BaseViewModel.prototype.init = function() {
                if(this.id())
                {
                    this.loadObjectData(this.id(), this.isTemplateMode());
                    
                    if(GoNorth.FlexFieldDatabase.ObjectForm.hasAikaRights && !this.isTemplateMode())
                    {
                        this.loadAikaQuests();
                    }

                    if(GoNorth.FlexFieldDatabase.ObjectForm.hasKirjaRights && !this.isTemplateMode())
                    {
                        this.loadKirjaPages();
                    }

                    if(GoNorth.FlexFieldDatabase.ObjectForm.hasKartaRights && !this.isTemplateMode())
                    {
                        this.loadKartaMaps();
                    }

                    if(GoNorth.FlexFieldDatabase.ObjectForm.hasTaleRights && !this.isTemplateMode())
                    {
                        this.loadTaleDialogs();
                    } 

                    if(GoNorth.FlexFieldDatabase.ObjectForm.hasKortistoRights && !this.isTemplateMode())
                    {
                        this.loadUsedInDailyRoutines();
                    } 

                    this.loadAdditionalDependencies();

                    this.acquireLock();
                }
                else if(this.templateId)
                {
                    this.loadObjectData(this.templateId, true);
                }
                this.loadExistingObjectTags();
            };

            /**
             * Checks if a customized export template exists
             */
            ObjectForm.BaseViewModel.prototype.checkIfCustomizedExportTemplateExists = function() {
                if(!this.id())
                {
                    return;
                }
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/ExportApi/DoesExportTemplateExistForObjectId?id=" + this.id(), 
                    type: "GET"
                }).done(function(data) {
                    self.showCustomizedExportTemplateWarningOnDelete(data.doesTemplateExist);
                }).fail(function(xhr) {
                    self.errorOccured(true);
                });
            };

            /**
             * Resets the error state
             */
            ObjectForm.BaseViewModel.prototype.resetErrorState = function() {
                this.errorOccured(false);
                this.additionalErrorDetails("");
                this.objectNotFound(false);
            };

            /**
             * Loads all existing objects tags for the tag dropdown list
             */
            ObjectForm.BaseViewModel.prototype.loadExistingObjectTags = function() {
                var self = this;
                jQuery.ajax({ 
                    url: "/api/" + this.apiControllerName + "/FlexFieldObjectTags", 
                    type: "GET"
                }).done(function(data) {
                    self.existingObjectTags(data);
                }).fail(function(xhr) {
                    self.errorOccured(true);
                });
            };

            /**
             * Loads the object data
             * 
             * @param {string} id Id of the data to load
             * @param {bool} fromTemplate true if the value should be loaded from a template
             */
            ObjectForm.BaseViewModel.prototype.loadObjectData = function(id, fromTemplate) {
                var url = "/api/" + this.apiControllerName + "/FlexFieldObject";
                if(fromTemplate)
                {
                    url = "/api/" + this.apiControllerName + "/FlexFieldTemplate"
                }
                url += "?id=" + id;

                this.isLoading(true);
                this.resetErrorState();
                var self = this;
                jQuery.ajax({ 
                    url: url, 
                    type: "GET"
                }).done(function(data) {
                    self.isLoading(false);
                    if(!data)
                    {
                        self.errorOccured(true);
                        self.objectNotFound(true);
                        return;
                    }
                    
                    if(!fromTemplate)
                    {
                        self.templateId = !self.isTemplateMode() ? data.templateId : "";
                        self.isImplemented(!self.isTemplateMode() ? data.isImplemented : false);
                    }

                    if(!fromTemplate || self.isTemplateMode())
                    {
                        self.objectName(data.name);
                    }
                    else
                    {
                        self.objectName("");
                    }
                    self.parseAdditionalData(data);
                    
                    self.thumbnailImageFilename(data.thumbnailImageFile);
                    self.imageFilename(data.imageFile);
                    self.fieldManager.deserializeFields(data.fields);

                    if(fromTemplate && !self.isTemplateMode())
                    {
                        self.fieldManager.flagFieldsAsCreatedFromTemplate();
                    }

                    self.objectTags(data.tags);

                    self.saveLastObjectState();
                }).fail(function(xhr) {
                    self.isLoading(false);
                    self.errorOccured(true);
                });
            };

            /**
             * Saves the last saved object state from the current state
             */
            ObjectForm.BaseViewModel.prototype.saveLastObjectState = function() {
                this.lastSavedObjectState = this.buildSaveRequestObject();
            };   

            /**
             * Saves the form
             */
            ObjectForm.BaseViewModel.prototype.save = function() {
                this.sendSaveRequest(false);
            };

            /**
             * Saves the form and distribute the fields to objects
             */
            ObjectForm.BaseViewModel.prototype.saveAndDistributeFields = function() {
                this.sendSaveRequest(true);
            };
            
            /**
             * Builds the save request object
             * 
             * @returns {object} Save request object
             */
            ObjectForm.BaseViewModel.prototype.buildSaveRequestObject = function() {
                var serializedFields = this.fieldManager.serializeFields();
                var requestObject = {
                    templateId: !this.isTemplateMode() ? this.templateId : "",
                    name: this.objectName(),
                    fields: serializedFields,
                    tags: this.objectTags()
                };
                requestObject = this.setAdditionalSaveData(requestObject);

                // Create mode values
                if(!this.isTemplateMode() && !this.id())
                {
                    requestObject.parentFolderId = this.parentFolderId;
                    if(this.imageFilename())
                    {
                        requestObject.imageFile = this.imageFilename();
                    }

                    if(this.thumbnailImageFilename())
                    {
                        requestObject.thumbnailImageFile = this.thumbnailImageFilename();
                    }
                }

                return requestObject;
            };

            /**
             * Saves the form
             * 
             * @param {bool} distributeFields true if the fields should be distributed, else false
             */
            ObjectForm.BaseViewModel.prototype.sendSaveRequest = function(distributeFields) {
                if(!jQuery("#gn-objectFields").valid())
                {
                    return;
                }

                // Send Data
                var requestObject = this.buildSaveRequestObject();

                var url = "";
                if(this.isTemplateMode())
                {
                    if(this.id())
                    {
                        url = "/api/" + this.apiControllerName + "/UpdateFlexFieldTemplate?id=" + this.id();
                    }
                    else
                    {
                        url = "/api/" + this.apiControllerName + "/CreateFlexFieldTemplate";
                    }
                }
                else
                {
                    if(this.id())
                    {
                        url = "/api/" + this.apiControllerName + "/UpdateFlexFieldObject?id=" + this.id();
                    }
                    else
                    {
                        url = "/api/" + this.apiControllerName + "/CreateFlexFieldObject";
                    }
                }

                this.isLoading(true);
                this.resetErrorState();
                var self = this;
                jQuery.ajax({ 
                    url: url, 
                    headers: GoNorth.Util.generateAntiForgeryHeader(),
                    data: JSON.stringify(requestObject), 
                    type: "POST",
                    contentType: "application/json"
                }).done(function(data) {
                    if(!self.id())
                    {
                        self.id(data.id);
                        var idAdd = "id=" + data.id;
                        if(self.isTemplateMode())
                        {
                            GoNorth.Util.replaceUrlParameters("template=1&" + idAdd);
                        }
                        else
                        {
                            GoNorth.Util.replaceUrlParameters(idAdd);
                        }
                        self.acquireLock();
                    }

                    if(!self.isTemplateMode())
                    {
                        self.fieldManager.syncFieldIds(data);
                        self.isImplemented(data.isImplemented);
                    }

                    if(distributeFields)
                    {
                        self.distributeFields();
                    }
                    else
                    {
                        self.isLoading(false);
                    }

                    self.runAfterSave(data);

                    self.callObjectGridRefresh();

                    self.lastSavedObjectState = requestObject;
                }).fail(function(xhr) {
                    self.isLoading(false);
                    self.errorOccured(true);

                    // If object is related to anything that prevents deleting a bad request (400) will be returned
                    if(xhr.status == 400 && xhr.responseText)
                    {
                        self.additionalErrorDetails(xhr.responseText);
                    }
                });
            };

            /**
             * Runs logic after save
             * 
             * @param {object} data Returned data after save
             */
            ObjectForm.BaseViewModel.prototype.runAfterSave = function(data) {

            };


            /**
             * Returns true if the form is dirty, else false
             * 
             * @returns {boolean} true if the form is dirty, else false
             */
            ObjectForm.BaseViewModel.prototype.isDirty = function() {
                var objectState = this.buildSaveRequestObject();
                return !GoNorth.Util.isEqual(objectState, this.lastSavedObjectState)
            };


            /**
             * Distributes the fields
             */
            ObjectForm.BaseViewModel.prototype.distributeFields = function() {
                var self = this;
                jQuery.ajax({ 
                    url: "/api/" + this.apiControllerName + "/DistributeFlexFieldTemplateFields?id=" + this.id(), 
                    headers: GoNorth.Util.generateAntiForgeryHeader(),
                    type: "POST",
                    contentType: "application/json"
                }).done(function(data) {
                    self.isLoading(false);
                }).fail(function(xhr) {
                    self.isLoading(false);
                    self.errorOccured(true);
                });
            };

            /**
             * Opens the delete object dialog
             */
            ObjectForm.BaseViewModel.prototype.openDeleteObjectDialog = function() {
                this.showConfirmObjectDeleteDialog(true);
            };

            /**
             * Closes the confirm delete dialog
             */
            ObjectForm.BaseViewModel.prototype.closeConfirmObjectDeleteDialog = function() {
                this.showConfirmObjectDeleteDialog(false);
            };

            /**
             * Deletes the object
             */
            ObjectForm.BaseViewModel.prototype.deleteObject = function() {
                var url = "/api/" + this.apiControllerName + "/DeleteFlexFieldObject";
                if(this.isTemplateMode())
                {
                    url = "/api/" + this.apiControllerName + "/DeleteFlexFieldTemplate"
                }
                url += "?id=" + this.id();

                this.isLoading(true);
                this.resetErrorState();
                var self = this;
                jQuery.ajax({ 
                    url: url, 
                    headers: GoNorth.Util.generateAntiForgeryHeader(),
                    type: "DELETE"
                }).done(function(data) {
                    self.callObjectGridRefresh();
                    self.closeConfirmObjectDeleteDialog();
                    window.location = self.rootPage;
                }).fail(function(xhr) {
                    self.isLoading(false);
                    self.errorOccured(true);
                    self.closeConfirmObjectDeleteDialog();

                    // If object is related to anything that prevents deleting a bad request (400) will be returned
                    if(xhr.status == 400 && xhr.responseText)
                    {
                        self.additionalErrorDetails(xhr.responseText);
                    }
                });
            };


            /**
             * Callback if a new image file was uploaded
             * 
             * @param {string} image Image Filename that was uploaded
             */
            ObjectForm.BaseViewModel.prototype.imageUploaded = function(image) {
                this.imageFilename(image);
                this.callObjectGridRefresh();
            };

            /**
             * Callback if an error occured during upload
             * 
             * @param {string} errorMessage Error Message
             * @param {object} xhr Xhr Object
             */
            ObjectForm.BaseViewModel.prototype.imageUploadError = function(errorMessage, xhr) {
                this.errorOccured(true);
                if(xhr && xhr.responseText)
                {
                    this.additionalErrorDetails(xhr.responseText);
                }
                else
                {
                    this.additionalErrorDetails(errorMessage);
                }
            };


            /**
             * Opens the compare dialog for the current object
             * 
             * @returns {jQuery.Deferred} Deferred which gets resolved after the object is marked as implemented
             */
            ObjectForm.BaseViewModel.prototype.openCompareDialogForObject = function() {
                var def = new jQuery.Deferred();
                def.reject("Not implemented");
                return def.promise();
            };

            /**
             * Opens the compare dialog
             */
            ObjectForm.BaseViewModel.prototype.openCompareDialog = function() {
                var self = this;
                this.openCompareDialogForObject().done(function() {
                    self.isImplemented(true);
                });
            };


            /**
             * Opens the export template
             * 
             * @param {number} templateType Type of the template
             */
            ObjectForm.BaseViewModel.prototype.openExportTemplate = function(templateType) {
                if(!this.id())
                {
                    return;
                }

                var url = "/Export/ManageTemplate?templateType=" + templateType + "&customizedObjectId=" + this.id();
                if(this.isTemplateMode())
                {
                    url += "&objectIsTemplate=1";
                }
                window.location = url;
            };

            /**
             * Exports an object
             * 
             * @param {number} templateType Type of the template
             * @param {string} exportFormat Format to export to (Script, JSON, Language)
             */
            ObjectForm.BaseViewModel.prototype.exportObject = function(templateType, exportFormat) {
                if(this.isDirty())
                {
                    var self = this;
                    this.openConfirmExportDirtyStateDialog().done(function() {
                        self.openExportObjectDialog(templateType, exportFormat);
                    });
                    return;
                }

                this.openExportObjectDialog(templateType, exportFormat);
            };

            /**
             * Opens the confirm export dirty state dialog
             * 
             * @param {number} templateType Type of the template
             * @param {string} exportFormat Format to export to (Script, JSON, Language)
             */
            ObjectForm.BaseViewModel.prototype.openConfirmExportDirtyStateDialog = function() {
                this.showConfirmExportDirtyStateDialog(true);
                this.showConfirmExportDirtyStatePromise = new jQuery.Deferred();

                return this.showConfirmExportDirtyStatePromise.promise();
            };

            /**
             * Confirms the export dirty state dialog
             */
            ObjectForm.BaseViewModel.prototype.confirmExportDirtyStateDialog = function() {
                this.showConfirmExportDirtyStateDialog(false);
                if(this.showConfirmExportDirtyStatePromise)
                {
                    this.showConfirmExportDirtyStatePromise.resolve();
                    this.showConfirmExportDirtyStatePromise = null;
                }
            };

            /**
             * Closes the export dirty state dialog
             */
            ObjectForm.BaseViewModel.prototype.closeConfirmExportDirtyStateDialog = function() {
                this.showConfirmExportDirtyStateDialog(false);
                if(this.showConfirmExportDirtyStatePromise)
                {
                    this.showConfirmExportDirtyStatePromise.reject();
                    this.showConfirmExportDirtyStatePromise = null;
                }
            };

            /**
             * Opens the export object dialog
             * 
             * @param {number} templateType Type of the template
             * @param {string} exportFormat Format to export to (Script, JSON, Language)
             */
            ObjectForm.BaseViewModel.prototype.openExportObjectDialog = function(templateType, exportFormat) {
                this.exportResultFormat = exportFormat;
                this.isLoading(true);
                this.errorOccured(false);
                var self = this;
                jQuery.ajax({ 
                    url: "/api/ExportApi/ExportObject?exportFormat=" + exportFormat + "&id=" + this.id() + "&templateType=" + templateType, 
                    type: "GET"
                }).done(function(data) {
                    self.isLoading(false);
                    self.showExportResultDialog(true);
                    self.exportResultContent(data.code);
                    self.exportResultErrors(self.groupExportErrors(data.errors));
                }).fail(function(xhr) {
                    self.closeExportResultDialog();
                    self.errorOccured(true);
                    self.isLoading(false);
                });
            };

            /**
             * Groups the export errors by export context
             * 
             * @param {object[]} errors Errors to group
             * @returns {object[]} Grouped errors
             */
            ObjectForm.BaseViewModel.prototype.groupExportErrors = function(errors) {
                if(!errors) 
                {
                    return [];
                }

                var errorGroups = {};
                var groupedErrors = [];
                for(var curError = 0; curError < errors.length; ++curError)
                {
                    if(!errorGroups[errors[curError].errorContext])
                    {
                        var errorGroup = {
                            contextName: errors[curError].errorContext,
                            errors: []
                        };
                        errorGroups[errorGroup.contextName] = errorGroup;
                        groupedErrors.push(errorGroup);
                    }

                    errorGroups[errors[curError].errorContext].errors.push(errors[curError]);
                }

                // Make sure errors with no contextname are shown first
                groupedErrors = groupedErrors.sort(function(g1, g2) {
                    if(!g1.contextName)
                    {
                        return -1;
                    }
                    else if(!g2.contextName)
                    {
                        return 1;
                    }

                    return 0;
                });

                return groupedErrors;
            };

            /**
             * Closes the export result dialog
             */
            ObjectForm.BaseViewModel.prototype.closeExportResultDialog = function() {
                this.showExportResultDialog(false);
                this.exportResultContent("");
                this.exportResultErrors([]);
            }; 

            /**
             * Downloads an export result
             * 
             * @param {number} templateType Type of the template
             */
            ObjectForm.BaseViewModel.prototype.exportDownload = function(templateType) {
                window.location = "/api/ExportApi/ExportObjectDownload?exportFormat=" + this.exportResultFormat + "&id=" + this.id() + "&templateType=" + templateType; 
            };

            /**
             * Copies the export result to the clipboard
             */
            ObjectForm.BaseViewModel.prototype.copyExportCodeToClipboard = function() {
                var exportResultField = jQuery("#gn-flexFieldObjectExportResultTextarea")[0];
                exportResultField.select();
                document.execCommand("copy");

                this.exportShowSuccessfullyCopiedTooltip(true);
                var self = this;
                setTimeout(function() {
                    self.exportShowSuccessfullyCopiedTooltip(false);
                }, 1000);
            };


            /**
             * Opens the code snippet dialog
             * 
             * @param {number} templateType Type of the template
             */
            ObjectForm.BaseViewModel.prototype.openCodeSnippetDialog = function(templateType) {
                this.exportSnippetManager.openSnippetManagerDialog(this.id(), templateType);
            }


            /**
             * Opens the confirm regenerate language keys dialog
             */
            ObjectForm.BaseViewModel.prototype.openConfirmRegenerateLanguageKeysDialog = function() {
                this.showConfirmRegenerateLanguageKeysDialog(true);
            };

            /**
             * Regenerates the language keys
             */
            ObjectForm.BaseViewModel.prototype.regenerateLanguageKeys = function() {
                this.isLoading(true);
                this.resetErrorState();
                var self = this;
                jQuery.ajax({ 
                    url: "/api/ExportApi/DeleteLanguageKeysByGroupId?groupId=" + this.id(), 
                    headers: GoNorth.Util.generateAntiForgeryHeader(),
                    type: "DELETE"
                }).done(function(data) {
                    self.isLoading(false);
                    self.closeConfirmRegenerateLanguageKeysDialog();
                }).fail(function(xhr) {
                    self.isLoading(false);
                    self.errorOccured(true);
                    self.closeConfirmRegenerateLanguageKeysDialog();
                });
            };

            /**
             * Closes the confirm regenerate language keys dialog
             */
            ObjectForm.BaseViewModel.prototype.closeConfirmRegenerateLanguageKeysDialog = function() {
                this.showConfirmRegenerateLanguageKeysDialog(false);
            };


            /**
             * Loads the Aika quests
             */
            ObjectForm.BaseViewModel.prototype.loadAikaQuests = function() {
                this.loadingReferencedInQuests(true);
                this.errorLoadingReferencedInQuests(false);
                var self = this;
                jQuery.ajax({ 
                    url: "/api/AikaApi/GetQuestsObjectIsReferenced?objectId=" + this.id(), 
                    type: "GET"
                }).done(function(data) {
                    self.referencedInQuests(data);
                    self.loadingReferencedInQuests(false);
                }).fail(function(xhr) {
                    self.errorLoadingReferencedInQuests(true);
                    self.loadingReferencedInQuests(false);
                });
            };

            /**
             * Builds the url for an Aika quest
             * 
             * @param {object} quest Quest to build the url
             * @returns {string} Url for quest
             */
            ObjectForm.BaseViewModel.prototype.buildAikaQuestUrl = function(quest) {
                return "/Aika/Quest?id=" + quest.id;
            };


            /**
             * Loads the kirja pages
             */
            ObjectForm.BaseViewModel.prototype.loadKirjaPages = function() {
                this.loadingMentionedInKirjaPages(true);
                this.errorLoadingMentionedInKirjaPages(false);
                var self = this;
                jQuery.ajax({ 
                    url: "/api/KirjaApi/" + this.kirjaApiMentionedMethod + this.id(), 
                    type: "GET"
                }).done(function(data) {
                    self.mentionedInKirjaPages(data);
                    self.loadingMentionedInKirjaPages(false);
                }).fail(function(xhr) {
                    self.errorLoadingMentionedInKirjaPages(true);
                    self.loadingMentionedInKirjaPages(false);
                });
            };

            /**
             * Builds the url for a Kirja page
             * 
             * @param {object} page Page to build the url for
             * @returns {string} Url for the page
             */
            ObjectForm.BaseViewModel.prototype.buildKirjaPageUrl = function(page) {
                return "/Kirja?id=" + page.id;
            };


            /**
             * Loads the karta maps
             */
            ObjectForm.BaseViewModel.prototype.loadKartaMaps = function() {
                if(!this.kartaApiMarkedMethod)
                {
                    return;
                }

                this.loadingMarkedInKartaMaps(true);
                this.errorLoadingMarkedInKartaMaps(false);
                var self = this;
                jQuery.ajax({ 
                    url: "/api/KartaApi/" + this.kartaApiMarkedMethod + this.id(), 
                    type: "GET"
                }).done(function(data) {
                    for(var curMap = 0; curMap < data.length; ++curMap)
                    {
                        data[curMap].tooltip = self.buildKartaMapMarkerCountTooltip(data[curMap]);
                    }
                    self.markedInKartaMaps(data);
                    self.loadingMarkedInKartaMaps(false);
                }).fail(function(xhr) {
                    self.errorLoadingMarkedInKartaMaps(true);
                    self.loadingMarkedInKartaMaps(false);
                });
            };

            /**
             * Builds the Tooltip for a marker count
             * 
             * @param {object} map Map to build the tooltip for
             * @returns {string} Tooltip for marker count
             */
            ObjectForm.BaseViewModel.prototype.buildKartaMapMarkerCountTooltip = function(map) {
                return GoNorth.FlexFieldDatabase.ObjectForm.Localization.MarkedInMapNTimes.replace("{0}", map.markerIds.length);
            };

            /**
             * Builds the url for a Karta map
             * 
             * @param {object} map Map to build the url for
             * @returns {string} Url for the map
             */
            ObjectForm.BaseViewModel.prototype.buildKartaMapUrl = function(map) {
                var url = "/Karta?id=" + map.mapId;
                if(map.markerIds.length == 1)
                {
                    url += "&zoomOnMarkerId=" + map.markerIds[0] + "&zoomOnMarkerType=" + map.mapMarkerType
                }
                return url;
            };


            /**
             * Loads the tale dialogs
             */
            ObjectForm.BaseViewModel.prototype.loadTaleDialogs = function() {
                this.loadingReferencedInTaleDialogs(true);
                this.errorLoadingReferencedInTaleDialogs(false);
                var self = this;
                jQuery.ajax({ 
                    url: "/api/TaleApi/GetDialogsObjectIsReferenced?objectId=" + this.id(), 
                    type: "GET"
                }).done(function(dialogs) {
                    var npcIds = [];
                    for(var curDialog = 0; curDialog < dialogs.length; ++curDialog)
                    {
                        if(dialogs[curDialog].relatedObjectId != self.id())
                        {
                            npcIds.push(dialogs[curDialog].relatedObjectId);
                        }
                    }

                    if(npcIds.length == 0)
                    {
                        self.referencedInTaleDialogs([]);
                        self.loadingReferencedInTaleDialogs(false);
                        return;
                    }

                    // Get Npc names of the dialog npcs
                    jQuery.ajax({ 
                        url: "/api/KortistoApi/ResolveFlexFieldObjectNames", 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify(npcIds), 
                        type: "POST",
                        contentType: "application/json"
                    }).done(function(npcNames) {
                        self.referencedInTaleDialogs(npcNames);
                        self.loadingReferencedInTaleDialogs(false);
                    }).fail(function(xhr) {
                        self.errorLoadingReferencedInTaleDialogs(true);
                        self.loadingReferencedInTaleDialogs(false);
                    });
                }).fail(function(xhr) {
                    self.errorLoadingReferencedInTaleDialogs(true);
                    self.loadingReferencedInTaleDialogs(false);
                });
            };

            /**
             * Builds the url for a Tale dialog
             * 
             * @param {object} dialogNpc Npc for which to open the dialog
             * @returns {string} Url for the dialog
             */
            ObjectForm.BaseViewModel.prototype.buildTaleDialogUrl = function(dialogNpc) {
                return "/Tale?npcId=" + dialogNpc.id;
            };


            /**
             * Loads the npcs in which the daily routines are used
             */
            ObjectForm.BaseViewModel.prototype.loadUsedInDailyRoutines = function() {
                this.loadingReferencedInDailyRoutines(true);
                this.errorLoadingReferencedInDailyRoutines(false);
                var self = this;
                jQuery.ajax({ 
                    url: "/api/KortistoApi/GetNpcsObjectIsReferencedInDailyRoutine?objectId=" + this.id(), 
                    type: "GET"
                }).done(function(data) {
                    self.referencedInDailyRoutines(data);
                    self.loadingReferencedInDailyRoutines(false);
                }).fail(function(xhr) {
                    self.errorLoadingReferencedInDailyRoutines(true);
                    self.loadingReferencedInDailyRoutines(false);
                });
            };

            /**
             * Builds the url for a Npcs
             * 
             * @param {object} npc Npc to build the url for
             * @returns {string} Url for the npc
             */
            ObjectForm.BaseViewModel.prototype.buildDailyRoutineNpcUrl = function(npc) {
                return "/Kortisto/Npc?id=" + npc.id;
            };


            /**
             * Acquires a lock
             */
            ObjectForm.BaseViewModel.prototype.acquireLock = function() {
                var category = this.lockName;
                if(this.isTemplateMode())
                {
                    category = this.templateLockName;
                }

                var self = this;
                GoNorth.LockService.acquireLock(category, this.id()).done(function(isLocked, lockedUsername) {
                    if(isLocked)
                    {
                        self.isReadonly(true);
                        self.lockedByUser(lockedUsername);
                        self.setAdditionalDataToReadonly();
                    }
                }).fail(function() {
                    self.errorOccured(true);
                    self.isReadonly(true);
                });
            };

            /**
             * Sets additional data to readonly
             */
            ObjectForm.BaseViewModel.prototype.setAdditionalDataToReadonly = function() {

            };


            /**
             * Calls the refresh for the object grid of the parent window
             */
            ObjectForm.BaseViewModel.prototype.callObjectGridRefresh = function() {
                if(window.refreshFlexFieldObjectGrid)
                {
                    window.refreshFlexFieldObjectGrid();
                }
            };

        }(FlexFieldDatabase.ObjectForm = FlexFieldDatabase.ObjectForm || {}));
    }(GoNorth.FlexFieldDatabase = GoNorth.FlexFieldDatabase || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Shapes) {

            /// Quest state not started
            var questStateNotStarted = 0;

            /// Quest state in progress
            var questStateInProgress = 1;

            /// Quest state success
            var questStateSuccess = 2;

            /// Quest state failed
            var questStateFailed = 3;

            /// Quest state label lookup
            var questStateLabelLookup = { };
            questStateLabelLookup[questStateNotStarted] = DefaultNodeShapes.Localization.QuestStates.NotStarted;
            questStateLabelLookup[questStateInProgress] = DefaultNodeShapes.Localization.QuestStates.InProgress;
            questStateLabelLookup[questStateSuccess] = DefaultNodeShapes.Localization.QuestStates.Success;
            questStateLabelLookup[questStateFailed] = DefaultNodeShapes.Localization.QuestStates.Failed;

            /**
             * Creates a quest state object
             * 
             * @param {int} questState QUest State Number
             * @returns {object} Quest State Object
             */
            function createState(questState) {
                return {
                    questState: questState,
                    label: questStateLabelLookup[questState]
                };
            };

            /**
             * Returns the quest state label for a quest state value
             * 
             * @param {int} questState Quest State to return the label for
             * @returns {string} Quest State Label
             */
            Shapes.getQuestStateLabel = function(questState) {
                return questStateLabelLookup[questState];
            };

            /**
             * Returns all available quest states
             * 
             * @returns {object[]} Array of all available quest states
             */
            Shapes.getQuestStates = function() {
                return [
                    createState(questStateNotStarted),
                    createState(questStateInProgress),
                    createState(questStateSuccess),
                    createState(questStateFailed)
                ];
            };

        }(DefaultNodeShapes.Shapes = DefaultNodeShapes.Shapes || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Shapes) {

            /// Object Resource for npcs
            Shapes.ObjectResourceNpc = 0;

            /// Object Resource for items
            Shapes.ObjectResourceItem = 1;

            /// Object Resource for quests
            Shapes.ObjectResourceQuest = 2;
            
            /// Object Resource for dialogs
            Shapes.ObjectResourceDialogs = 3;

            /// Object Resource for Map Marker
            Shapes.ObjectResourceMapMarker = 4;

            /// Object Resource for Skills
            Shapes.ObjectResourceSkill = 5;
            
            /// Object Resource for Project misc config
            Shapes.ObjectResourceProjectMiscConfig = 6;


            /// Cached loaded objects
            var loadedObjects = {};

            /// Deferreds for loading objects
            var objectsLoadingDeferreds = {};


            /**
             * Resets the loaded value for an object
             * 
             * @param {number} objectType Object Type
             * @param {string} objectId Object Id
             */
            Shapes.resetSharedObjectLoading = function(objectType, objectId)
            {
                if(loadedObjects[objectType] && loadedObjects[objectType][objectId])
                {
                    loadedObjects[objectType][objectId] = null;
                }

                if(objectsLoadingDeferreds[objectType] && objectsLoadingDeferreds[objectType][objectId])
                {
                    objectsLoadingDeferreds[objectType][objectId] = null;
                }
            };


            /**
             * Shared object loading
             * @class
             */
            Shapes.SharedObjectLoading = function()
            {
            };

            Shapes.SharedObjectLoading.prototype = {
                /**
                 * Returns the id for an object
                 * 
                 * @param {object} existingData Optional Existing data
                 * @returns {string} Object Id
                 */
                getObjectId: function(existingData) {

                },

                /**
                 * Returns the object resource
                 * 
                 * @param {object} existingData Optional Existing data
                 * @returns {int} Object Resource
                 */
                getObjectResource: function(existingData) {

                },

                /**
                 * Clears a loaded shared object
                 * 
                 * @param {object} existingData Optional Existing data
                 */
                clearLoadedSharedObject: function(existingData) {
                    var objectId = this.getObjectId(existingData);
                    if(loadedObjects[this.getObjectResource()]) {
                        loadedObjects[this.getObjectResource()][objectId] = null;
                    }

                    if(objectsLoadingDeferreds[this.getObjectResource()]) {
                        objectsLoadingDeferreds[this.getObjectResource()][objectId] = null;
                    }
                },

                /**
                 * Loads a shared object
                 * 
                 * @param {object} existingData Optional Existing data
                 */
                loadObjectShared: function(existingData) {
                    var objectId = this.getObjectId(existingData);
    
                    if(loadedObjects[this.getObjectResource(existingData)]) {
                        var existingObject = loadedObjects[this.getObjectResource(existingData)][objectId];
                        if(existingObject)
                        {
                            var def = new jQuery.Deferred();
                            def.resolve(existingObject);
                            return def.promise();
                        }
                    }
    
                    var self = this;
                    if(objectsLoadingDeferreds[this.getObjectResource(existingData)])
                    {
                        var existingDef = objectsLoadingDeferreds[this.getObjectResource(existingData)][objectId];
                        if(existingDef)
                        {
                            existingDef.fail(function() {
                                if(self.showErrorCallback) {
                                    self.showErrorCallback();
                                }
                            });
                            return existingDef;
                        }
                    }
    
                    var loadingDef = this.loadObject(objectId, existingData);
                    if(!objectsLoadingDeferreds[this.getObjectResource(existingData)])
                    {
                        objectsLoadingDeferreds[this.getObjectResource(existingData)] = {};
                    }

                    objectsLoadingDeferreds[this.getObjectResource(existingData)][objectId] = loadingDef;
    
                    loadingDef.then(function(object) {
                        if(!loadedObjects[self.getObjectResource(existingData)])
                        {
                            loadedObjects[self.getObjectResource(existingData)] = {};
                        }

                        loadedObjects[self.getObjectResource(existingData)][objectId] = object;
                    }, function() {
                        if(self.showErrorCallback) {
                            self.showErrorCallback();
                        }
                    });
    
                    return loadingDef;
                },

                /**
                 * Loads an object
                 * 
                 * @param {string} objectId Optional Object Id extracted using getObjectId before
                 * @param {object} existingData Existing data
                 * @returns {jQuery.Deferred} Deferred for the loading process
                 */
                loadObject: function(objectId, existingData) {
                    
                }
            };


        }(DefaultNodeShapes.Shapes = DefaultNodeShapes.Shapes || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {

        /**
         * Node Shapes Base View Model
         * @class
         */
        DefaultNodeShapes.BaseViewModel = function()
        {
            this.nodeGraph = new ko.observable();
            this.nodePaper = new ko.observable();
        
            this.showConfirmNodeDeleteDialog = new ko.observable(false);
            this.deleteLoading = new ko.observable(false);
            this.deleteErrorOccured = new ko.observable(false);
            this.deleteErrorAdditionalInformation =  new ko.observable("");
            this.deleteNodeTarget = null;
            this.deleteDeferred = null;

            this.errorOccured = new ko.observable(false);
        };

        DefaultNodeShapes.BaseViewModel.prototype = {

            /**
             * Adds a new node
             * 
             * @param {object} dropElement Element that was dropped
             * @param {float} x X-Drop Coordinate
             * @param {float} z X-Drop Coordinate
             */
            addNewNode: function(dropElement, x, y) {
                if(!this.nodeGraph() || !this.nodePaper())
                {
                    return;
                }

                var initOptions = this.calcNodeInitOptionsPosition(x, y);
                this.addNodeByType(dropElement.data("nodetype"), initOptions);
            },

            /**
             * Creates the node init options with the node position
             * 
             * @param {float} x X-Drop Coordinate
             * @param {float} z X-Drop Coordinate
             */
            calcNodeInitOptionsPosition: function(x, y) {
                var scale = this.nodePaper().scale();
                var translate = this.nodePaper().translate();
                var initOptions = {
                    position: { x: (x - translate.tx) / scale.sx, y: (y - translate.ty) / scale.sy }
                };
                return initOptions;
            },

            /**
             * Adds a new node by the type
             * 
             * @param {string} nodeType Type of the new node
             * @param {object} initOptions Init Options for the node
             */
            addNodeByType: function(nodeType, initOptions) {
                var newNode = GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance().createNewNode(nodeType, initOptions);
                if(newNode == null)
                {
                    this.errorOccured(true);
                    return;
                }

                this.nodeGraph().addCells(newNode);
                this.setupNewNode(newNode);
            },

            /**
             * Prepares a new node
             * 
             * @param {object} newNode New Node to setup
             */
            setupNewNode: function(newNode) {
                newNode.attr(".inPorts circle/magnet", "passive");
                
                var self = this;
                newNode.onDelete = function(node) {
                    return self.onDelete(node);
                };
            },

            /**
             * Reloads the fields for nodes
             * 
             * @param {string} id Id of the object for which to reload the nodes
             */
            reloadFieldsForNodes: function(objectType, id) {
                GoNorth.DefaultNodeShapes.Shapes.resetSharedObjectLoading(objectType, id);

                if(!this.nodeGraph())
                {
                    return;
                }

                var paper = this.nodePaper();
                var elements = this.nodeGraph().getElements();
                for(var curElement = 0; curElement < elements.length; ++curElement)
                {
                    var view = paper.findViewByModel(elements[curElement]);
                    if(view && view.reloadSharedLoadedData)
                    {
                        view.reloadSharedLoadedData(objectType, id);
                    }
                }
            },


            /**
             * Delete Callback if a user wants to delete a node
             * 
             * @param {object} node Node to delete
             * @returns {jQuery.Deferred} Deferred that will be resolved if the user deletes the node
             */
            onDelete: function(node) {
                this.deleteLoading(false);
                this.deleteErrorOccured(false);
                this.deleteErrorAdditionalInformation("");
                this.showConfirmNodeDeleteDialog(true);

                this.deleteNodeTarget = node;
                this.deleteDeferred = new jQuery.Deferred();
                return this.deleteDeferred.promise();
            },

            /**
             * Deletes the node for which the dialog is opened
             */
            deleteNode: function() {
                if(!this.deleteNodeTarget || !this.deleteNodeTarget.validateDelete)
                {
                    this.resolveDeleteDeferred();
                }
                else
                {
                    var deleteDef = this.deleteNodeTarget.validateDelete();
                    if(!deleteDef)
                    {
                        this.resolveDeleteDeferred();
                    }
                    else
                    {
                        var self = this;
                        this.deleteLoading(true);
                        this.deleteErrorOccured(false);
                        this.deleteErrorAdditionalInformation(""); 
                        deleteDef.done(function() {
                            self.deleteLoading(false);
                            self.resolveDeleteDeferred();
                        }).fail(function(err) {
                            self.deleteLoading(false);
                            self.deleteErrorOccured(true);
                            self.deleteErrorAdditionalInformation(err); 
                        });
                    }
                }
            },

            /**
             * Resolves the delete deferred
             */
            resolveDeleteDeferred: function() {
                if(this.deleteDeferred)
                {
                    this.deleteDeferred.resolve();
                    this.deleteDeferred = null;
                }
                this.closeConfirmNodeDeleteDialog();
            },

            /**
             * Closes the confirm delete node dialog
             */
            closeConfirmNodeDeleteDialog: function() {
                if(this.deleteDeferred)
                {
                    this.deleteDeferred.reject();
                    this.deleteDeferred = null;
                }
                this.showConfirmNodeDeleteDialog(false);
                this.deleteLoading(false);
                this.deleteErrorOccured(false);
                this.deleteErrorAdditionalInformation("");
                this.deleteNodeTarget = null;
            },

            /**
             * Sets the graph to readonly mode
             */
            setGraphToReadonly: function() {
                jQuery(".gn-nodeGraphContainer").find("input,textarea,select").prop("disabled", true);
                jQuery(".gn-nodeGraphContainer").find(".joint-cell").css("pointer-events", "none");
                jQuery(".gn-nodeGraphContainer").find(".gn-nodeDeleteOnReadonly").remove();
                jQuery(".gn-nodeGraphContainer").find(".gn-nodeNonClickableOnReadonly").css("pointer-events", "none");
            }
        };

    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
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
(function(GoNorth) {
    "use strict";
    (function(ScriptDialog) {

            /**
             * Viewmodel for a dialog to enter a code script
             * @param {ko.observable} errorOccured Error occured observable
             * @class
             */
            ScriptDialog.CodeScriptDialog = function(errorOccured)
            {
                this.errorOccured = errorOccured;

                this.isVisible = new ko.observable(false);
                this.isEditing = new ko.observable(false);

                this.originalScriptName = "";
                this.originalScriptCode = "";
                this.scriptName = new ko.observable("");
                this.scriptCode = new ko.observable("");

                this.editDeferred = null;
                
                this.codeEditorTheme = new ko.observable("");
                this.codeEditorScriptLanguage = new ko.observable("");

                this.showConfirmCloseDialog = new ko.observable(false);
                this.confirmedClose = false;

                this.loadConfig();
            };

            ScriptDialog.CodeScriptDialog.prototype = {
                /**
                 * Loads the config
                 */
                loadConfig: function() {
                    var self = this;
                    jQuery.ajax("/api/UserPreferencesApi/GetCodeEditorPreferences").done(function(config) {
                        self.codeEditorTheme(config.codeEditorTheme);
                        self.codeEditorScriptLanguage(config.scriptLanguage);
                    }).fail(function() {
                        self.errorOccured(true);
                    });;
                },

                /**
                 * Opens the create code script dialog
                 * @returns {jQuery.Deferred} Deferred that will be resolved with the result of the dialog
                 */
                openCreateDialog: function() {
                    return this.openDialogInternally("", "");
                },
                
                /**
                 * Opens the edit code script dialog
                 * 
                 * @param {string} name Name to edit
                 * @param {string} code Code to edit
                 * @returns {jQuery.Deferred} Deferred that will be resolved with the result of the dialog
                 */
                openEditDialog: function(name, code) {
                    return this.openDialogInternally(name, code);
                },

                /**
                 * Opens the code script dialog
                 * @param {string} name Name to edit
                 * @param {string} code Code to edit
                 * @returns {jQuery.Deferred} Deferred that will be resolved with the result of the dialog
                 */
                openDialogInternally: function(name, code) {
                    if(this.editDeferred != null)
                    {
                        this.editDeferred.reject();
                    }

                    this.isVisible(true);
                    this.isEditing(!!name);

                    this.originalScriptName = name;
                    this.originalScriptCode = code;
                    this.scriptName(name);
                    this.scriptCode(code);

                    this.showConfirmCloseDialog(false);
                    this.confirmedClose = false;

                    GoNorth.Util.setupValidation("#gn-codeScriptEditorForm");

                    this.editDeferred = new jQuery.Deferred();
                    return this.editDeferred.promise();
                },

                /**
                 * Saves the code
                 */
                saveCode: function() {
                    if(!jQuery("#gn-codeScriptEditorForm").valid())
                    {
                        return;
                    }

                    this.confirmedClose = true;
                    this.isVisible(false);
                    if(this.editDeferred != null)
                    {
                        this.editDeferred.resolve({
                            name: this.scriptName(),
                            code: this.scriptCode()
                        });
                    }
                },

                /**
                 * Cancels the dialog
                 */
                cancelDialog: function() {
                    this.isVisible(false);
                    if(this.editDeferred != null)
                    {
                        this.editDeferred.reject();
                    }
                },

                /**
                 * Callback gets called before the dialog gets closed
                 * @returns {boolean} true if the dialog should be closed, else false
                 */
                onClosingDialog: function() {
                    if(this.confirmedClose)
                    {
                        return true;
                    }

                    if(this.originalScriptCode != this.scriptCode() || this.originalScriptName != this.scriptName())
                    {
                        this.showConfirmCloseDialog(true);
                        return false;
                    }
                    else
                    {
                        this.showConfirmCloseDialog(false);
                        return true;
                    }
                },

                /**
                 * Confirms the close dialog
                 */
                confirmCloseDialog: function() {
                    this.confirmedClose = true;

                    this.showConfirmCloseDialog(false);
                    this.isVisible(false);
                },

                
                /**
                 * Cancels the close dialog
                 */
                cancelCloseDialog: function() {
                    this.showConfirmCloseDialog(false);
                }
            };

    }(GoNorth.ScriptDialog = GoNorth.ScriptDialog || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(ScriptDialog) {

            /**
             * Viewmodel for a dialog to enter a script using a node system
             * @param {ko.observable} npcId Npc id to which the node system is related
             * @param {GoNorth.ChooseObjectDialog.ViewModel} objectDialog Object choose dialog
             * @param {GoNorth.ScriptDialog.CodeEditor} codeEditor Code editor dialog
             * @param {ko.observable} errorOccured Error occured observable
             * @class
             */
            ScriptDialog.NodeScriptDialog = function(npcId, objectDialog, codeEditor, errorOccured)
            {
                GoNorth.DefaultNodeShapes.BaseViewModel.apply(this);

                this.npcId = npcId;

                this.chooseObjectDialog = objectDialog;
                this.errorOccured = errorOccured;

                this.isVisible = new ko.observable(false);
                this.isEditing = new ko.observable(false);

                this.originalScriptName = "";
                this.originalScriptNodes = {};
                this.scriptName = new ko.observable("");

                this.conditionDialog = new GoNorth.DefaultNodeShapes.Conditions.ConditionDialog();

                this.codeEditor = codeEditor;

                this.editDeferred = null;

                this.showConfirmCloseDialog = new ko.observable(false);
                this.confirmedClose = false;

                // Add access to object id for actions and conditions
                var self = this;
                GoNorth.DefaultNodeShapes.getCurrentRelatedObjectId = function() {
                    return self.npcId();
                };

                // Add access to condition dialog
                GoNorth.DefaultNodeShapes.openConditionDialog = function(condition) {
                    var conditionDialogDeferred = new jQuery.Deferred();
                    self.conditionDialog.openDialog(condition, conditionDialogDeferred);
                    return conditionDialogDeferred;
                };

                // Opens the item search dialog
                GoNorth.DefaultNodeShapes.openItemSearchDialog = function() {
                    return self.chooseObjectDialog.openItemSearch(GoNorth.DefaultNodeShapes.Localization.Dialogs.ChooseItem);
                };

                // Opens the quest search dialog 
                GoNorth.DefaultNodeShapes.openQuestSearchDialog = function() {
                    return self.chooseObjectDialog.openQuestSearch(ScriptDialog.Localization.NodeScripts.ChooseQuest);                    
                };
                
                // Opens the npc search dialog 
                GoNorth.DefaultNodeShapes.openNpcSearchDialog = function() {
                    return self.chooseObjectDialog.openNpcSearch(ScriptDialog.Localization.NodeScripts.ChooseNpc);                    
                };

                // Opens the skill search dialog 
                GoNorth.DefaultNodeShapes.openSkillSearchDialog = function() {
                    return self.chooseObjectDialog.openSkillSearch(ScriptDialog.Localization.NodeScripts.ChooseSkill);                    
                };

                // Opens the daily routine event dialog
                GoNorth.DefaultNodeShapes.openDailyRoutineEventSearchDialog = function() {
                    return self.chooseObjectDialog.openDailyRoutineSearch(ScriptDialog.Localization.NodeScripts.ChooseDailyRoutineEvent);                    
                };

                // Opens the daily routine event dialog
                GoNorth.DefaultNodeShapes.openMarkerSearchDialog = function() {
                    return self.chooseObjectDialog.openMarkerSearch(ScriptDialog.Localization.NodeScripts.ChooseMarker);                    
                };
                
                // Opens the code editor
                GoNorth.DefaultNodeShapes.openCodeEditor = function(name, scriptCode) {
                    return self.codeEditor.openEditDialog(name, scriptCode);              
                };

                // Load config lists
                GoNorth.DefaultNodeShapes.Shapes.loadConfigLists().fail(function() {
                    self.errorOccured(true);
                });
            };

            
            ScriptDialog.NodeScriptDialog.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.BaseViewModel.prototype);

            ScriptDialog.NodeScriptDialog.prototype = jQuery.extend(ScriptDialog.NodeScriptDialog.prototype, {
                /**
                 * Opens the create node script dialog
                 * @returns {jQuery.Deferred} Deferred that will be resolved with the result of the dialog
                 */
                openCreateDialog: function() {
                    return this.openDialogInternally("", {});
                },
                
                /**
                 * Opens the edit node script dialog
                 * 
                 * @param {string} name Name to edit
                 * @param {string} nodes Nodes to edit
                 * @returns {jQuery.Deferred} Deferred that will be resolved with the result of the dialog
                 */
                openEditDialog: function(name, nodes) {
                    return this.openDialogInternally(name, nodes);
                },

                /**
                 * Opens the node script dialog
                 * @param {string} name Name to edit
                 * @param {string} nodes Nodes to edit
                 * @returns {jQuery.Deferred} Deferred that will be resolved with the result of the dialog
                 */
                openDialogInternally: function(name, nodes) {
                    if(this.editDeferred != null)
                    {
                        this.editDeferred.reject();
                    }

                    this.isVisible(true);
                    this.isEditing(!!name);
                    
                    var nodeSerializer = GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance();
                    var self = this;
                    this.scriptName(name);
                    setTimeout(function() { // Timeout needed to prevent errors with styles because dialog is still opening
                        nodeSerializer.deserializeGraph(self.nodeGraph(), nodes, function(newNode) { self.setupNewNode(newNode); });
                        self.originalScriptNodes = nodeSerializer.serializeGraph(self.nodeGraph());
                        self.resetDependsOnObject(self.originalScriptNodes);
                    }, 150);

                    this.originalScriptName = name;

                    this.showConfirmCloseDialog(false);
                    this.confirmedClose = false;
                    
                    GoNorth.Util.setupValidation("#gn-nodeScriptEditorForm");

                    this.editDeferred = new jQuery.Deferred();
                    return this.editDeferred.promise();
                },

                /**
                 * Saves the nodes
                 */
                saveNodes: function() {
                    if(!jQuery("#gn-nodeScriptEditorForm").valid())
                    {
                        return;
                    }

                    this.confirmedClose = true;
                    this.isVisible(false);
                    if(this.editDeferred != null)
                    {
                        var nodeSerializer = GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance();
                        var serializedGraph = nodeSerializer.serializeGraph(this.nodeGraph());
                        this.editDeferred.resolve({
                            name: this.scriptName(),
                            graph: serializedGraph
                        });
                    }
                },

                /**
                 * Cancels the dialog
                 */
                cancelDialog: function() {
                    this.isVisible(false);
                    if(this.editDeferred != null)
                    {
                        this.editDeferred.reject();
                    }
                },

                /**
                 * Callback gets called before the dialog gets closed
                 * @returns {boolean} true if the dialog should be closed, else false
                 */
                onClosingDialog: function() {
                    if(this.confirmedClose)
                    {
                        return true;
                    }

                    if(!this.nodeGraph())
                    {
                        return true;
                    }
                    
                    var nodeSerializer = GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance();
                    var serializedGraph = nodeSerializer.serializeGraph(this.nodeGraph());
                    this.resetDependsOnObject(serializedGraph);
                    if(JSON.stringify(this.originalScriptNodes) != JSON.stringify(serializedGraph) || this.originalScriptName != this.scriptName())
                    {
                        this.showConfirmCloseDialog(true);
                        return false;
                    }
                    else
                    {
                        this.showConfirmCloseDialog(false);
                        return true;
                    }
                },

                /**
                 * Confirms the close dialog
                 */
                confirmCloseDialog: function() {
                    this.confirmedClose = true;

                    this.showConfirmCloseDialog(false);
                    this.isVisible(false);
                },

                
                /**
                 * Cancels the close dialog
                 */
                cancelCloseDialog: function() {
                    this.showConfirmCloseDialog(false);
                },

                
                /**
                 * Resets the depends objects
                 * @param {object} serializedNodeGraph Serialized node graph
                 */
                resetDependsOnObject: function(serializedNodeGraph) {
                    if(serializedNodeGraph.action) {
                        for(var curAction = 0; curAction < serializedNodeGraph.action.length; ++curAction) {
                            serializedNodeGraph.action[curAction].actionRelatedToObjectId = "";
                            serializedNodeGraph.action[curAction].actionRelatedToObjectType = "";
                        }
                    }

                    if(serializedNodeGraph.condition) {
                        for(var curCondition = 0; curCondition < serializedNodeGraph.condition.length; ++curCondition) {
                            if(!serializedNodeGraph.condition[curCondition].conditions) {
                                continue;
                            }

                            for(var curConditionPart = 0; curConditionPart < serializedNodeGraph.condition[curCondition].conditions.length; ++curConditionPart)
                            {
                                serializedNodeGraph.condition[curCondition].conditions[curConditionPart].dependsOnObjects = [];
                            }
                        }
                    }
                }
            });

    }(GoNorth.ScriptDialog = GoNorth.ScriptDialog || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DailyRoutines) {
        (function(Util) {
        
            /**
             * Formats a timespan
             * @param {string} timeFormat Time format
             * @param {object} earliest Earliest time
             * @param {object} latest Latest time
             * @returns {string} Formatted timespan
             */
            Util.formatTimeSpan = function(timeFormat, earliest, latest) {
                var timeSpanText = "";
                if(earliest) {
                    timeSpanText = GoNorth.Util.formatTime(earliest.hours, earliest.minutes, timeFormat);
                }

                if(latest && (!earliest || earliest.hours != latest.hours || earliest.minutes != latest.minutes))
                {
                    if(timeSpanText) {
                        timeSpanText += " - ";
                    }
                    timeSpanText += GoNorth.Util.formatTime(latest.hours, latest.minutes, timeFormat);
                }

                return timeSpanText;
            };

            /**
             * Keeps two observable for an earliest or latest time in order so that the latest time is never before the earliest and the other way around
             * @param {ko.observable} earliestTime Earliest time observable
             * @param {ko.observable} latestTime Latest time observable
             */
            Util.keepTimeObservablesInOrder = function(earliestTime, latestTime) {
                earliestTime.subscribe(function(newValue) {
                    var latestTimeValue = latestTime();
                    if(!newValue || !latestTimeValue) {
                        return;
                    }

                    if(newValue.hours > latestTimeValue.hours || (newValue.hours == latestTimeValue.hours && newValue.minutes > latestTimeValue.minutes))
                    {
                        latestTime(newValue);
                    }
                });
                latestTime.subscribe(function(newValue) {
                    var earliestTimeValue = earliestTime();
                    if(!newValue || !earliestTimeValue) {
                        return;
                    }

                    if(newValue.hours < earliestTimeValue.hours || (newValue.hours == earliestTimeValue.hours && newValue.minutes < earliestTimeValue.minutes))
                    {
                        earliestTime(newValue);
                    }
                });  
            };

            /**
             * Returns true if any time events overlap
             * @param {object[]} timeEvents Array with time events
             * @returns {boolean} true if any events overlap, else false
             */
            Util.doEventsOverlap = function(timeEvents) {
                for(var curEvent1 = 0; curEvent1 < timeEvents.length; ++curEvent1)
                {
                    if(!timeEvents[curEvent1].enabledByDefault())
                    {
                        continue;
                    }

                    for(var curEvent2 = curEvent1 + 1; curEvent2 < timeEvents.length; ++curEvent2)
                    {
                        if(!timeEvents[curEvent2].enabledByDefault())
                        {
                            continue;
                        }

                        var earliestTimeComp = GoNorth.BindingHandlers.compareTimes(timeEvents[curEvent1].earliestTime(), timeEvents[curEvent2].earliestTime());
                        var latestTimeComp = GoNorth.BindingHandlers.compareTimes(timeEvents[curEvent1].latestTime(), timeEvents[curEvent2].latestTime());
                        var earliestTimeInBetweenComp = GoNorth.BindingHandlers.compareTimes(timeEvents[curEvent1].earliestTime(), timeEvents[curEvent2].latestTime());
                        var latestTimeInBetweenComp = GoNorth.BindingHandlers.compareTimes(timeEvents[curEvent1].latestTime(), timeEvents[curEvent2].earliestTime());
                        if(earliestTimeComp != latestTimeComp || earliestTimeInBetweenComp != latestTimeComp || latestTimeInBetweenComp != earliestTimeComp)
                        {
                            return true;
                        }
                    }
                }

                return false;
            };

        }(DailyRoutines.Util = DailyRoutines.Util || {}));
    }(GoNorth.DailyRoutines = GoNorth.DailyRoutines || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(BindingHandlers) {

        if(typeof ko !== "undefined")
        {

            /**
             * Writes the timespan to an observbale
             * @param {object} element HTML Element
             * @param {string} timeFormat Time format
             * @param {ko.observable} earliestTime Earliest time
             * @param {ko.observable} latestTime Latest time
             */
            function outputTimespan(element, timeFormat, earliestTime, latestTime) {
                var earliest = ko.unwrap(earliestTime);
                var latest = ko.unwrap(latestTime);

                var timeSpanText = GoNorth.DailyRoutines.Util.formatTimeSpan(timeFormat, earliest, latest);
                
                jQuery(element).text(timeSpanText);
            }

            /**
             * Timespan binding handler
             */
            ko.bindingHandlers.timeSpan = {
                init: function (element, valueAccessor, allBindings) {
                    var timeFormat = "hh:mm";
                    if(allBindings.get("timeSpanTimeFormat")) {
                        timeFormat = allBindings.get("timeSpanTimeFormat");
                    }

                    var timeValues = ko.utils.unwrapObservable(valueAccessor());
                    var earliestTime = timeValues.earliestTime;
                    var latestTime = timeValues.latestTime;

                    if(ko.isObservable(earliestTime)) {
                        var earliestSubscription = earliestTime.subscribe(function() {
                            outputTimespan(element, timeFormat, earliestTime, latestTime);
                        });
                        earliestSubscription.disposeWhenNodeIsRemoved(element);
                    }
                    
                    if(ko.isObservable(latestTime)) {
                        var latestSubscription = latestTime.subscribe(function() {
                            outputTimespan(element, timeFormat, earliestTime, latestTime);
                        });
                        latestSubscription.disposeWhenNodeIsRemoved(element);
                    }

                    outputTimespan(element, timeFormat, earliestTime, latestTime);
                },
                update: function (element, valueAccessor, allBindings) {
                }
            }

        }

    }(GoNorth.BindingHandlers = GoNorth.BindingHandlers || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(Shared) {
        (function(ChooseScriptTypeDialog) {

            /**
             * Value that will be returned in the openDialog promise if a node graph was selected. If changed, please make sure that the script types in the daily routines event object or code snippets are matching.
             */
            ChooseScriptTypeDialog.nodeGraph = 0;
            
            /**
             * Value that will be returned in the openDialog promise if a code script was selected. If changed, please make sure that the script types in the daily routines event object or code snippets are matching.
             */
            ChooseScriptTypeDialog.codeScript = 1;

            /**
             * Viewmodel for a dialog to choose the script type
             * @class
             */
            ChooseScriptTypeDialog.ViewModel = function()
            {
                this.isVisible = new ko.observable(false);

                this.creationDeferred = null;
            };

            ChooseScriptTypeDialog.ViewModel.prototype = {
                /**
                 * Opens the script type choosing dialog
                 * @returns {jQuery.Deferred} Deferred that will be resolved with the result of the selection
                 */
                openDialog: function() {
                    if(this.creationDeferred != null)
                    {
                        this.creationDeferred.reject();
                    }

                    this.isVisible(true);
                    this.creationDeferred = new jQuery.Deferred();
                    return this.creationDeferred.promise();
                },

                /**
                 * Creates a node graph
                 */
                createNodeGraph: function() {
                    this.isVisible(false);
                    if(this.creationDeferred != null)
                    {
                        this.creationDeferred.resolve(ChooseScriptTypeDialog.nodeGraph);
                    }
                },
                
                /**
                 * Creates a code script
                 */
                createCodeScript: function() {
                    this.isVisible(false);
                    if(this.creationDeferred != null)
                    {
                        this.creationDeferred.resolve(ChooseScriptTypeDialog.codeScript);
                    }
                },

                /**
                 * Cancels the dialog
                 */
                cancelDialog: function() {
                    this.isVisible(false);
                    if(this.creationDeferred != null)
                    {
                        this.creationDeferred.reject();
                    }
                }
            };

        }(Shared.ChooseScriptTypeDialog = Shared.ChooseScriptTypeDialog || {}));
    }(GoNorth.Shared = GoNorth.Shared || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DailyRoutines) {
        
        /**
         * Daily Routine event types
         */
        DailyRoutines.ScriptTypes = {
            none: -1,
            nodeGraph: 0,
            codeScript: 1
        };

        /**
         * Daily Routine event types. If these are changed, please make sure that the script types in the choose script type dialog are matching.
         */
        DailyRoutines.EventTypes = {
            movement: 0,
            script: 1
        };

        /**
         * Creates a movement target
         * @param {string} mapId If of the map for which the movement target is valid
         * @param {string} name Name of the target
         * @param {string} exportName Export name of the target
         * @param {number} lat Latitude
         * @param {number} lng Longitude
         * @returns {object} Movement target
         */
        DailyRoutines.createMovementTarget = function(mapId, name, exportName, lat, lng) {
            return {
                mapId: mapId,
                name: name,
                exportName: exportName,
                lat: lat,
                lng: lng
            }
        };
        
        /**
         * Creates a new event
         * @param {number} eventType Event Type
         * @param {object} earliestTime Earliest Time at which the event should occure
         * @param {object} latestTime Latest Time at which the event should occure
         * @param {object} movementTarget Movement target
         * @param {string} targetState Target state of the npc upon arriving at the destination
         * @param {number} scriptType Type of the script to run on arrival of the target or upon triggering the event
         * @param {string} scriptName Name of the script
         * @param {object} scriptNodeGraph Script Nodegraph
         * @param {string} scriptCode Script code
         * @param {boolean} enabledByDefault true if the event should be enabled by default
         */
        DailyRoutines.createRoutineEvent = function (eventType, earliestTime, latestTime, movementTarget, targetState, scriptType, scriptName, scriptNodeGraph, scriptCode, enabledByDefault) {
            return {
                eventId: null,
                eventType: eventType,
                earliestTime: new ko.observable(GoNorth.BindingHandlers.buildTimeObject(earliestTime.hours, earliestTime.minutes)),
                latestTime: new ko.observable(GoNorth.BindingHandlers.buildTimeObject(latestTime.hours, latestTime.minutes)),
                movementTarget: movementTarget,
                targetState: new ko.observable(targetState),
                scriptType: scriptType,
                scriptName: new ko.observable(scriptName),
                scriptNodeGraph: scriptNodeGraph,
                scriptCode: scriptCode,
                enabledByDefault: new ko.observable(enabledByDefault)
            };
        };

        /**
         * Serializes a routine event
         * @param {object} eventObj Object to serialize
         * @returns {object} Serialized routine event
         */
        DailyRoutines.serializeRoutineEvent = function(eventObj) {
            return {
                eventId: eventObj.eventId,
                eventType: eventObj.eventType,
                earliestTime: eventObj.earliestTime(),
                latestTime: eventObj.latestTime(),
                movementTarget: eventObj.movementTarget,
                targetState: eventObj.targetState(),
                scriptType: eventObj.scriptType,
                scriptName: eventObj.scriptName(),
                scriptNodeGraph: eventObj.scriptNodeGraph,
                scriptCode: eventObj.scriptCode,
                enabledByDefault: eventObj.enabledByDefault()
            };
        };

        /**
         * Deserializes a daily routine event array
         * @param {object[]} dailyRoutine Daily routine event array
         * @returns {object[]} Deserialized daily routine events
         */
        DailyRoutines.deserializeRoutineEventArray = function(dailyRoutine) {
            if(!dailyRoutine) {
                return [];
            }

            var deserializedEvents = [];
            for(var curEvent = 0; curEvent < dailyRoutine.length; ++curEvent)
            {
                deserializedEvents.push(GoNorth.DailyRoutines.deserializeRoutineEvent(dailyRoutine[curEvent]));
            }

            return deserializedEvents;
        }

        /**
         * Deserializes a routine event
         * @param {object} eventObj Object to serialize
         * @returns {object} Serialized routine event
         */
        DailyRoutines.deserializeRoutineEvent = function(eventObj) {
            var routineObj = DailyRoutines.createRoutineEvent(eventObj.eventType, eventObj.earliestTime, eventObj.latestTime, eventObj.movementTarget, eventObj.targetState, eventObj.scriptType, eventObj.scriptName, 
                                                              eventObj.scriptNodeGraph, eventObj.scriptCode, eventObj.enabledByDefault);
            routineObj.eventId = eventObj.eventId;
            return routineObj;
        };

    }(GoNorth.DailyRoutines = GoNorth.DailyRoutines || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Shapes) {

            /// Action Type
            var actionType = "default.Action";
            
            /// Action Target Array
            var actionTargetArray = "action";


            /// All available actions
            var availableActions = [];

            /// Height of action node
            var actionNodeHeight = 200;

            /**
             * Adds a new available action
             * 
             * @param {object} action Action
             */
            Shapes.addAvailableAction = function(action) {
                availableActions.push(action);
            }

            /**
             * Loads the config for an action
             * 
             * @param {string} configKey Config key
             * @returns {jQuery.Deferred} Deferred for the request
             */
            function loadActionConfig(configKey) {
                var def = new jQuery.Deferred();

                jQuery.ajax("/api/ProjectConfigApi/GetJsonConfigByKey?configKey=" + encodeURIComponent(configKey)).done(function(loadedConfigData) {
                    if(!loadedConfigData)
                    {
                        def.resolve();
                        return;
                    }
                    
                    try
                    {
                        var configLines = JSON.parse(loadedConfigData)
                        var configList = jQuery("<datalist id='gn-" + configKey + "'></datalist>");
                        for(var curLine = 0; curLine < configLines.length; ++curLine)
                        {
                            configList.append(jQuery("<option></option>").text(configLines[curLine]));
                        }
                        jQuery("body").append(configList);
                        def.resolve();
                    }
                    catch(e)
                    {
                        self.errorOccured(true);
                        def.reject();
                    }
                }).fail(function() {
                    def.reject();
                })

                return def.promise();
            }

            /**
             * Loads all the config lists
             * @returns {jQuery.Deferred} Deferred for the requests
             */
            Shapes.loadConfigLists = function() {
                var usedConfigKeys = {};
                var loadingPromises = [];

                for(var curAction = 0; curAction < availableActions.length; ++curAction)
                {
                    var configKey = availableActions[curAction].getConfigKey();
                    if(configKey && !usedConfigKeys[configKey])
                    {
                        usedConfigKeys[configKey] = true;
                        loadingPromises.push(loadActionConfig(configKey));
                    }
                }

                return jQuery.when.apply(jQuery, loadingPromises);
            }

            joint.shapes.default = joint.shapes.default || {};

            /**
             * Creates the action shape
             * @returns {object} Action shape
             * @memberof Shapes
             */
            function createActionShape() {
                var model = joint.shapes.devs.Model.extend(
                {
                    defaults: joint.util.deepSupplement
                    (
                        {
                            type: actionType,
                            icon: "glyphicon-cog",
                            size: { width: 250, height: 200 },
                            inPorts: ['input'],
                            outPorts: ['output'],
                            attrs:
                            {
                                '.inPorts circle': { "magnet": "passive", "port-type": "input" },
                                '.outPorts circle': { "magnet": "true" }
                            },
                            actionType: null,
                            actionRelatedToObjectType: null,
                            actionRelatedToObjectId: null,
                            actionRelatedToAdditionalObjects: [],
                            actionData: null
                        },
                        joint.shapes.default.Base.prototype.defaults
                    )
                });
                return model;
            }

            /**
             * Creates a action view
             * @returns {object} Action view
             * @memberof Shapes
             */
            function createActionView() {
                return joint.shapes.default.BaseView.extend(
                {
                    /**
                     * Template
                     */
                    template:
                    [
                        '<div class="node">',
                            '<span class="label"><i class="nodeIcon glyphicon"></i><span class="labelText"></span></span>',
                            '<span class="gn-nodeLoading" style="display: none"><i class="glyphicon glyphicon-refresh spinning"></i></span>',
                            '<span class="gn-nodeError text-danger" style="display: none" title="' + GoNorth.DefaultNodeShapes.Localization.ErrorOccured + '"><i class="glyphicon glyphicon-warning-sign"></i></span>',
                            '<button class="delete gn-nodeDeleteOnReadonly cornerButton" title="' + GoNorth.DefaultNodeShapes.Localization.DeleteNode + '">x</button>',
                            '<select class="gn-actionNodeSelectActionType"></select>',
                            '<div class="gn-actionNodeActionContent"></div>',
                        '</div>',
                    ].join(''),

                    /**
                     * Initializes the shape
                     */
                    initialize: function() {
                        joint.shapes.default.BaseView.prototype.initialize.apply(this, arguments);

                        var actionTypeBox = this.$box.find(".gn-actionNodeSelectActionType");
                        GoNorth.Util.fillSelectFromArray(actionTypeBox, availableActions, function(action) { return action.getType(); }, function(action) { return action.getLabel(); });

                        var self = this;
                        actionTypeBox.on("change", function() {
                            self.resetActionData();
                            self.syncActionData();
                        });

                        actionTypeBox.find("option[value='" + this.model.get("actionType") + "']").prop("selected", true);

                        this.syncActionData();
                    },

                    /**
                     * Returns the current action
                     */
                    getCurrentAction: function() {
                        var actionType = this.$box.find(".gn-actionNodeSelectActionType").val();
                        for(var curAction = 0; curAction < availableActions.length; ++curAction)
                        {
                            if(availableActions[curAction].getType() == actionType)
                            {
                                return availableActions[curAction];
                            }
                        }
                        return null;
                    },

                    /**
                     * Resets the action data
                     */
                    resetActionData: function() {
                        this.model.set("actionRelatedToObjectType", null);
                        this.model.set("actionRelatedToObjectId", null);
                        this.model.set("actionRelatedToAdditionalObjects", []);
                        this.model.set("actionData", null);

                        if(this.model.get("actionCustomAttributes")) 
                        {
                            var customAttributes = this.model.get("actionCustomAttributes");
                            for(var curAttribute = 0; curAttribute < customAttributes.length; ++curAttribute)
                            {
                                this.model.set(customAttributes[curAttribute], null);
                            }
                            this.model.set("actionCustomAttributes", null);
                        }
                    },

                    /**
                     * Syncs the action data
                     */
                    syncActionData: function() {
                        var action = this.getCurrentAction();
                        if(!action)
                        {
                            return;
                        }

                        var currentAction = action.buildAction();
                        currentAction.setNodeModel(this.model);
                        this.model.set("actionType", currentAction.getType());

                        var actionContent = this.$box.find(".gn-actionNodeActionContent");
                        actionContent.html(currentAction.getContent());
                        this.model.set("actionCustomAttributes", currentAction.getCustomActionAttributes());
                        var self = this;
                        currentAction.showErrorCallback = function() {
                            self.showError();
                        };
                        this.syncOutputPorts(currentAction);
                        currentAction.onInitialized(actionContent, this);
                    },

                    /**
                     * Syncs the output ports
                     * @param {object} currentAction Action to load the output ports from
                     */
                    syncOutputPorts: function(currentAction) {
                        var currentPortDisplayNames = [];
                        this.$el.find(".gn-nodeActionOutputLabel").each(function() {
                            currentPortDisplayNames.push(jQuery(this).find("tspan").text());
                        });
                        if(currentPortDisplayNames.length == 0)
                        {
                            currentPortDisplayNames.push("");
                        }

                        var outPorts = ["output"];
                        var outPortDisplayNames = [currentAction.getMainOutputLabel()];

                        var additionalOutPorts = currentAction.getAdditionalOutports();
                        if(additionalOutPorts)
                        {
                            for(var curPort = 0; curPort < additionalOutPorts.length; ++curPort)
                            {
                                outPorts.push("additionalActionOutput" + (curPort + 1));
                                outPortDisplayNames.push(additionalOutPorts[curPort])
                            }
                        }

                        if(!GoNorth.Util.isEqual(currentPortDisplayNames, outPortDisplayNames))
                        {
                            this.model.set("outPorts", outPorts);

                            // Update Port Positions
                            if(outPorts.length > 1)
                            {
                                var heightsPerPort = actionNodeHeight / (outPorts.length + 1);
                                for(var curPort = 0; curPort < outPorts.length; ++curPort)
                                {
                                    var label = "";
                                    if(curPort == 0)
                                    {
                                        label = currentAction.getMainOutputLabel();
                                    }
                                    else
                                    {
                                        label = additionalOutPorts[curPort - 1];
                                    }

                                    this.model.attr(".outPorts>.port" + curPort, { "ref-y": (heightsPerPort * (curPort + 1)) + "px", "ref": ".body" });
                                    this.model.attr(".outPorts>.port" + curPort + " .port-label", { "title": label, "class": "gn-nodeActionOutputLabel", "dx": 15, "dy": 0 });
                                }
                            }
                            else
                            {
                                this.model.attr(".outPorts>.port0" + " .port-label", { "title": "", "class": "", "dx": 15, "dy": 0 });
                            }

                            // setTimeout is required to have the element ready on load
                            var self = this;
                            setTimeout(function() {
                                self.$el.find(".gn-nodeActionOutputLabel").each(function() {
                                    jQuery(this).find("tspan").text(jQuery(this).attr("title"));
                                });
                            }, 1);
                        }
                    },

                    /**
                     * Reloads the shared data
                     * 
                     * @param {number} objectType Object Type
                     * @param {string} objectId Object Id
                     */
                    reloadSharedLoadedData: function(objectType, objectId) {
                        if(this.model.get("actionRelatedToObjectId") == objectId)
                        {
                            this.syncActionData();
                        }
                    },


                    /**
                     * Shows the loading indicator
                     */
                    showLoading: function() {
                        this.$box.find(".gn-nodeLoading").show();
                    },

                    /**
                     * Hides the loading indicator
                     */
                    hideLoading: function() {
                        this.$box.find(".gn-nodeLoading").hide();
                    },


                    /**
                     * Shows the error indicator
                     */
                    showError: function() {
                        this.$box.find(".gn-nodeError").show();
                    },

                    /**
                     * Hides the error indicator
                     */
                    hideError: function() {
                        this.$box.find(".gn-nodeError").hide();
                    }
                });
            }

            /**
             * Action Shape
             */
            joint.shapes.default.Action = createActionShape();

            /**
             * Action View
             */
            joint.shapes.default.ActionView = createActionView();


            /** 
             * Action Serializer 
             * 
             * @class
             */
            Shapes.ActionSerializer = function()
            {
                GoNorth.DefaultNodeShapes.Serialize.BaseNodeSerializer.apply(this, [ joint.shapes.default.Action, actionType, actionTargetArray ]);
            };

            Shapes.ActionSerializer.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Serialize.BaseNodeSerializer.prototype)

            /**
             * Serializes a node
             * 
             * @param {object} node Node Object
             * @returns {object} Serialized NOde
             */
            Shapes.ActionSerializer.prototype.serialize = function(node) {
                var serializedData = {
                    id: node.id,
                    x: node.position.x,
                    y: node.position.y,
                    actionType: node.actionType,
                    actionRelatedToObjectType: node.actionRelatedToObjectType,
                    actionRelatedToObjectId: node.actionRelatedToObjectId,
                    actionRelatedToAdditionalObjects: node.actionRelatedToAdditionalObjects,
                    actionData: node.actionData
                };

                return serializedData;
            };

            /**
             * Deserializes a serialized node
             * 
             * @param {object} node Serialized Node Object
             * @returns {object} Deserialized Node
             */
            Shapes.ActionSerializer.prototype.deserialize = function(node) {
                var initOptions = {
                    id: node.id,
                    position: { x: node.x, y: node.y },
                    actionType: node.actionType,
                    actionRelatedToObjectType: node.actionRelatedToObjectType,
                    actionRelatedToObjectId: node.actionRelatedToObjectId,
                    actionRelatedToAdditionalObjects: node.actionRelatedToAdditionalObjects,
                    actionData: node.actionData
                };

                var node = new this.classType(initOptions);
                return node;
            };

            // Register Serializers
            var actionSerializer = new Shapes.ActionSerializer();
            GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance().addNodeSerializer(actionSerializer);

        }(DefaultNodeShapes.Shapes = DefaultNodeShapes.Shapes || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Actions that are related to npcs
            Actions.RelatedToObjectNpc = "Npc";

            /// Actions that are related to quests
            Actions.RelatedToObjectQuest = "Quest";

            /// Actions that are related to skills
            Actions.RelatedToObjectSkill = "Skill";

            /// Actions that are related to items
            Actions.RelatedToObjectItem = "Item";

            /// Actions that are related to map markers
            Actions.RelatedToObjectMapMarker = "MapMarker";

            /// Actions that are related to a map
            Actions.RelatedToObjectMap = "Map";

            /// Actions that are related to a daily routine
            Actions.RelatedToObjectDailyRoutine = "NpcDailyRoutineEvent";

            /**
             * Base Action
             * @class
             */
            Actions.BaseAction = function()
            {
                this.nodeModel = null;
            };

            Actions.BaseAction.prototype = {
                /**
                 * Builds the action
                 * 
                 * @returns {object} Action
                 */
                buildAction: function() {

                },

                /**
                 * Sets the node model
                 * 
                 * @param {object} model Node model
                 */
                setNodeModel: function(model) {
                    this.nodeModel = model;
                },

                /**
                 * Returns the type of the action
                 * 
                 * @returns {number} Type of the action
                 */
                getType: function() {
                    return -1;
                },

                /**
                 * Returns the label of the action
                 * 
                 * @returns {string} Label of the action
                 */
                getLabel: function() {

                },

                /**
                 * Returns the HTML Content of the action
                 * 
                 * @returns {string} HTML Content of the action
                 */
                getContent: function() {

                },

                /**
                 * Returns the config key for the action
                 * 
                 * @returns {string} Config key
                 */
                getConfigKey: function() {
                    return null;
                },

                /**
                 * Returns the names of the custom action attributes
                 * 
                 * @returns {string[]} Name of the custom action attributes
                 */
                getCustomActionAttributes: function() {
                    return [];
                },

                /**
                 * Returns the label for the main output
                 * 
                 * @returns {string} Label for the main output
                 */
                getMainOutputLabel: function() {
                    return "";
                },

                /**
                 * Returns the additional outports of the action
                 * 
                 * @returns {string[]} Additional outports
                 */
                getAdditionalOutports: function() {
                    return [];
                },

                /**
                 * Gets called once the action was intialized
                 * 
                 * @param {object} contentElement Content element
                 * @param {ActionNode} actionNode Parent Action node
                 */
                onInitialized: function(contentElement, actionNode) {

                },

                /**
                 * Serializes the data
                 * 
                 * @returns {object} Serialized Data 
                 */
                serialize: function() {

                },

                /**
                 * Deserializes the data
                 * 
                 * @param {object} serializedData Serialized data
                 */
                deserialize: function(serializedData) {

                }
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Change Value Action
             * @class
             */
            Actions.ChangeValueAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);

                this.contentElement = null;
                this.filteredFields = [];

                this.isNumberValueSelected = false;
            };

            Actions.ChangeValueAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.ChangeValueAction.prototype = jQuery.extend(Actions.ChangeValueAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.ChangeValueAction.prototype.getObjectTypeName = function() {
            };

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.ChangeValueAction.prototype.getContent = function() {
                return  "<select class='gn-actionNodeAttributeSelect'></select>" +
                        "<select class='gn-actionNodeAttributeOperator'></select>" +
                        "<input type='text' class='gn-actionNodeAttributeChange'/>";
            };

            /**
             * Returns true if the action is using an individual object id for each object since the user can choose an object instead of having a fixed one, else false
             * 
             * @returns {bool} true if the action is using an individual object id for each object since the user can choose an object instead of having a fixed one, else false
             */
            Actions.ChangeValueAction.prototype.isUsingIndividualObjectId = function() {
                return false;
            };

            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.ChangeValueAction.prototype.getObjectId = function(existingData) {
                return null;
            };

            /**
             * Returns true if the object can be loaded, else false
             * 
             * @returns {bool} true if the object can be loaded, else false
             */
            Actions.ChangeValueAction.prototype.canLoadObject = function(existingData) {
                return true;
            };

            /**
             * Runs additional initialize actions
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ChangeValueAction.prototype.onInitializeAdditional = function(contentElement, actionNode) {

            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ChangeValueAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                this.deserializePreLoadData();

                if(this.canLoadObject())
                {
                    this.loadFields(contentElement, actionNode);
                }

                var self = this;
                contentElement.find(".gn-actionNodeAttributeSelect").on("change", function() {
                    self.syncOperators();
                    self.saveData();
                });

                contentElement.find(".gn-actionNodeAttributeOperator").on("change", function() {
                    self.saveData();
                });

                var attributeCompare = contentElement.find(".gn-actionNodeAttributeChange");
                attributeCompare.keydown(function(e) {
                    if(self.isNumberValueSelected)
                    {
                        GoNorth.Util.validateNumberKeyPress(attributeCompare, e);
                    }
                });

                attributeCompare.change(function(e) {
                    if(self.isNumberValueSelected)
                    {
                        self.ensureNumberValue();
                    }

                    self.saveData();
                });

                this.onInitializeAdditional(contentElement, actionNode);
            };

            /**
             * Parses additional data
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             * @param {object} fieldObject Loaded Field object
             */
            Actions.ChangeValueAction.prototype.parseAdditionalData = function(contentElement, actionNode, fieldObject) {
            };

            /**
             * Loads the fields
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ChangeValueAction.prototype.loadFields = function(contentElement, actionNode) {
                actionNode.showLoading();
                actionNode.hideError();

                var self = this;
                this.loadObjectShared().then(function(fieldObject) {
                    if(!fieldObject)
                    {
                        actionNode.hideLoading();
                        return;
                    }

                    // Set related object data
                    self.nodeModel.set("actionRelatedToObjectType", self.getObjectTypeName());
                    self.nodeModel.set("actionRelatedToObjectId", fieldObject.id);

                    // Fill field array
                    var attributeSelect = contentElement.find(".gn-actionNodeAttributeSelect");
                    self.filteredFields = GoNorth.Util.getFilteredFieldsForScript(fieldObject.fields);
                    
                    GoNorth.Util.fillSelectFromArray(attributeSelect, self.filteredFields, function(field, index) { return index; }, function(field) { 
                        var label = field.name + " ("; 
                        if(field.fieldType == GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldTypeNumber)
                        {
                            label += DefaultNodeShapes.Localization.Actions.NumberField;
                        }
                        else
                        {
                            label += DefaultNodeShapes.Localization.Actions.TextField;
                        }
                        label += ")";

                        return label;
                    });

                    // Parse additional data
                    self.parseAdditionalData(contentElement, actionNode, fieldObject);
                    
                    var dataExists = self.deserializeData();
                    if(!dataExists)
                    {
                        self.syncOperators();
                        self.saveData();
                    }
                    
                    actionNode.hideLoading();
                }, function() {
                    actionNode.hideLoading();
                    actionNode.showError();
                });
            };

            /**
             * Syncs the operators
             */
            Actions.ChangeValueAction.prototype.syncOperators = function() {
                var selectedField = this.contentElement.find(".gn-actionNodeAttributeSelect").val();
                var operatorSelect = this.contentElement.find(".gn-actionNodeAttributeOperator");
                var curField = this.filteredFields[selectedField];
                if(!curField)
                {
                    GoNorth.Util.fillSelectFromArray(operatorSelect, [], function(operator) { return operator; }, function(operator) { return operator; });
                    return;
                }

                var operators = [];
                if(curField.fieldType == GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldTypeNumber)
                {
                    operators = [ "=", "+=", "-=", "*=", "/=" ];
                    this.isNumberValueSelected = true;

                    this.ensureNumberValue();
                }
                else
                {
                    operators = [ "=" ];
                    this.isNumberValueSelected = false;
                }

                GoNorth.Util.fillSelectFromArray(operatorSelect, operators, function(operator) { return operator; }, function(operator) { return operator; });
            }

            /**
             * Ensures the user entered a number if a number field was selected
             */
            Actions.ChangeValueAction.prototype.ensureNumberValue = function() {
                var parsedValue = parseFloat(this.contentElement.find(".gn-actionNodeAttributeChange").val());
                if(isNaN(parsedValue))
                {
                    this.contentElement.find(".gn-actionNodeAttributeChange").val("0");
                }
            }

            /**
             * Deserializes data before loading data
             */
            Actions.ChangeValueAction.prototype.deserializePreLoadData = function() {
                
            };

            /**
             * Deserializes the data
             */
            Actions.ChangeValueAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return false;
                }

                var data = JSON.parse(actionData);
                var selectedFieldIndex = 0;
                for(var curField = 0; curField < this.filteredFields.length; ++curField)
                {
                    if(this.filteredFields[curField].id == data.fieldId)
                    {
                        selectedFieldIndex = curField;
                        
                        if(this.filteredFields[curField].name == data.fieldName)
                        {
                            break;
                        }
                    }
                }

                this.contentElement.find(".gn-actionNodeAttributeSelect").find("option[value='" + selectedFieldIndex + "']").prop("selected", true);
                this.syncOperators();
                this.contentElement.find(".gn-actionNodeAttributeOperator").find("option[value='" + data.operator + "']").prop("selected", true);
                this.contentElement.find(".gn-actionNodeAttributeChange").val(data.valueChange);

                return true;
            };

            /**
             * Serializes additional data
             * 
             * @param {object} serializeData Existing Serialize Data
             */
            Actions.ChangeValueAction.prototype.serializeAdditionalData = function(serializeData) {

            };

            /**
             * Saves the data
             */
            Actions.ChangeValueAction.prototype.saveData = function() {
                var selectedField = this.contentElement.find(".gn-actionNodeAttributeSelect").val();
                var curField = this.filteredFields[selectedField];
                var operator = this.contentElement.find(".gn-actionNodeAttributeOperator").val();
                var valueChange = this.contentElement.find(".gn-actionNodeAttributeChange").val();

                var serializeData = {
                    fieldId: curField ? curField.id : null,
                    fieldName: curField ? curField.name : null,
                    operator: operator,
                    valueChange: valueChange
                };

                this.serializeAdditionalData(serializeData);

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            }

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Base class for changing the value of object to pick
             * @class
             */
            Actions.ChangeValueChooseObjectAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ChangeValueAction.apply(this);
            };

            Actions.ChangeValueChooseObjectAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ChangeValueAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.ChangeValueChooseObjectAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeObjectSelect gn-clickable'>" + this.getChooseLabel() + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenObject' title='" + this.getOpenObjectTooltip() + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" +
                        "<select class='gn-actionNodeAttributeSelect'></select>" +
                        "<select class='gn-actionNodeAttributeOperator'></select>" +
                        "<input type='text' class='gn-actionNodeAttributeChange'/>";
            };

            /**
             * Returns the choose object label
             * 
             * @returns {string} Choose object label
             */
            Actions.ChangeValueChooseObjectAction.prototype.getChooseLabel = function() {
                return "NOT IMPLEMENTED";
            };

            /**
             * Returns the open object tool label
             * 
             * @returns {string} Open object label
             */
            Actions.ChangeValueChooseObjectAction.prototype.getOpenObjectTooltip = function() {
                return "NOT IMPLEMENTED";
            };

            /**
             * Returns true if the action is using an individual object id for each object since the user can choose an object instead of having a fixed one, else false
             * 
             * @returns {bool} true if the action is using an individual object id for each object since the user can choose an object instead of having a fixed one, else false
             */
            Actions.ChangeValueChooseObjectAction.prototype.isUsingIndividualObjectId = function() {
                return true;
            };

            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.ChangeValueChooseObjectAction.prototype.getObjectId = function(existingData) {
                return this.nodeModel.get("objectId");
            };

            /**
             * Returns the names of the custom action attributes
             * 
             * @returns {string[]} Name of the custom action attributes
             */
            Actions.ChangeValueChooseObjectAction.prototype.getCustomActionAttributes = function() {
                return [ "objectId" ];
            };

            /**
             * Returns true if the object can be loaded, else false
             * 
             * @returns {bool} true if the object can be loaded, else false
             */
            Actions.ChangeValueChooseObjectAction.prototype.canLoadObject = function() {
                return !!this.nodeModel.get("objectId");
            };

            /**
             * Opens the object
             * @param {string} id Id of the object
             */
            Actions.ChangeValueChooseObjectAction.prototype.openObject = function(id) {

            };

            /**
             * Opens the search dialog
             * 
             * @returns {jQuery.Deferred} Deferred for the picking
             */
            Actions.ChangeValueChooseObjectAction.prototype.openSearchDialog = function() {
            };

            /**
             * Parses additional data
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             * @param {object} fieldObject Loaded Field object
             */
            Actions.ChangeValueChooseObjectAction.prototype.parseAdditionalData = function(contentElement, actionNode, fieldObject) {
                contentElement.find(".gn-actionNodeObjectSelect").text(fieldObject.name);
            };

            /**
             * Runs additional initialize actions
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ChangeValueChooseObjectAction.prototype.onInitializeAdditional = function(contentElement, actionNode) {
                var self = this;

                var openObjectLink = contentElement.find(".gn-nodeActionOpenObject");

                contentElement.find(".gn-actionNodeObjectSelect").on("click", function() {
                    self.openSearchDialog().then(function(fieldObject) {
                        self.nodeModel.set("objectId", fieldObject.id);
                        self.loadFields(contentElement, actionNode);

                        contentElement.find(".gn-actionNodeObjectSelect").text(fieldObject.name);

                        openObjectLink.show();
                    });
                });

                if(this.nodeModel.get("objectId"))
                {
                    openObjectLink.show();
                }

                openObjectLink.on("click", function() {
                    var objectId = self.nodeModel.get("objectId");
                    if(objectId) 
                    {
                        self.openObject(objectId);
                    }
                });
            };

            /**
             * Serializes additional data
             * 
             * @param {object} serializeData Existing Serialize Data
             */
            Actions.ChangeValueChooseObjectAction.prototype.serializeAdditionalData = function(serializeData) {
                serializeData.objectId = this.nodeModel.get("objectId") ? this.nodeModel.get("objectId") : null;
            };

            /**
             * Deserializes data before loading data
             */
            Actions.ChangeValueChooseObjectAction.prototype.deserializePreLoadData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return;
                }

                var data = JSON.parse(actionData);
                this.nodeModel.set("objectId", data.objectId);
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for changing the player value
            var actionTypeChangePlayerValue = 1;

            /**
             * Change player value Action
             * @class
             */
            Actions.ChangePlayerValueAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ChangeValueAction.apply(this);
            };

            Actions.ChangePlayerValueAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ChangeValueAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ChangePlayerValueAction.prototype.buildAction = function() {
                return new Actions.ChangePlayerValueAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ChangePlayerValueAction.prototype.getType = function() {
                return actionTypeChangePlayerValue;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ChangePlayerValueAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChangePlayerValueLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.ChangePlayerValueAction.prototype.getObjectTypeName = function() {
                return Actions.RelatedToObjectNpc;
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ChangePlayerValueAction.prototype.getObjectId = function() {
                return "PlayerNpc";
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ChangePlayerValueAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the npc
             * 
             * @returns {jQuery.Deferred} Deferred for the npc loading
             */
            Actions.ChangePlayerValueAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();

                var self = this;
                jQuery.ajax({ 
                    url: "/api/KortistoApi/PlayerNpc", 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ChangePlayerValueAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for changing the npc value
            var actionTypeChangeNpcValue = 2;

            /**
             * Change npc value Action
             * @class
             */
            Actions.ChangeNpcValueAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ChangeValueAction.apply(this);
            };

            Actions.ChangeNpcValueAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ChangeValueAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ChangeNpcValueAction.prototype.buildAction = function() {
                return new Actions.ChangeNpcValueAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ChangeNpcValueAction.prototype.getType = function() {
                return actionTypeChangeNpcValue;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ChangeNpcValueAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChangeNpcValueLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.ChangeNpcValueAction.prototype.getObjectTypeName = function() {
                return Actions.RelatedToObjectNpc;
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ChangeNpcValueAction.prototype.getObjectId = function() {
                return DefaultNodeShapes.getCurrentRelatedObjectId();
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ChangeNpcValueAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the npc
             * 
             * @returns {jQuery.Deferred} Deferred for the npc loading
             */
            Actions.ChangeNpcValueAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + DefaultNodeShapes.getCurrentRelatedObjectId(), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ChangeNpcValueAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Change Inventory Action
             * @class
             */
            Actions.ChangeInventoryAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.ChangeInventoryAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.ChangeInventoryAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeSelectItemAction gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenItem' title='" + DefaultNodeShapes.Localization.Actions.OpenItemTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" +
                        "<div class='gn-nodeActionText'>" + DefaultNodeShapes.Localization.Actions.ItemQuantity + "</div>" +
                        "<input type='text' class='gn-nodeItemQuantity'/>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ChangeInventoryAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;
                this.contentElement.find(".gn-nodeSelectItemAction").text(DefaultNodeShapes.Localization.Actions.ChooseItem);

                var itemOpenLink = contentElement.find(".gn-nodeActionOpenItem");

                // Deserialize
                var existingItemId = this.deserializeData();
                if(existingItemId)
                {
                    itemOpenLink.show();

                    actionNode.showLoading();
                    actionNode.hideError();
                    jQuery.ajax({ 
                        url: "/api/StyrApi/ResolveFlexFieldObjectNames", 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify([ existingItemId ]), 
                        type: "POST",
                        contentType: "application/json"
                    }).done(function(itemNames) {
                        if(itemNames.length == 0)
                        {
                            actionNode.hideLoading();
                            actionNode.showError();
                            return;
                        }

                        contentElement.find(".gn-nodeSelectItemAction").text(itemNames[0].name);
                        actionNode.hideLoading();
                    }).fail(function(xhr) {
                        actionNode.hideLoading();
                        actionNode.showError();
                    });
                }

                // Handlers
                var self = this;
                var selectItemAction = contentElement.find(".gn-nodeSelectItemAction");
                contentElement.find(".gn-nodeSelectItemAction").on("click", function() {
                    DefaultNodeShapes.openItemSearchDialog().then(function(item) {
                        selectItemAction.data("itemid", item.id);
                        selectItemAction.text(item.name);
                        self.saveData();

                        itemOpenLink.show();
                    });
                });

                var itemQuantity = contentElement.find(".gn-nodeItemQuantity");
                itemQuantity.keydown(function(e) {
                    GoNorth.Util.validateNumberKeyPress(itemQuantity, e);
                });

                itemQuantity.change(function(e) {
                    self.ensureNumberValue();
                    self.saveData();
                });

                itemOpenLink.on("click", function() {
                    if(selectItemAction.data("itemid"))
                    {
                        window.open("/Styr/Item?id=" + selectItemAction.data("itemid"));
                    }
                });
            };

            /**
             * Ensures a number value was entered for the item quantity
             */
            Actions.ChangeInventoryAction.prototype.ensureNumberValue = function() {
                var parsedValue = parseFloat(this.contentElement.find(".gn-nodeItemQuantity").val());
                if(isNaN(parsedValue))
                {
                    this.contentElement.find(".gn-nodeItemQuantity").val("");
                }
            };

            /**
             * Deserializes the data
             * @returns {string} Deserialized item id
             */
            Actions.ChangeInventoryAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                var itemId = "";
                if(data.itemId)
                {
                    this.contentElement.find(".gn-nodeSelectItemAction").data("itemid", data.itemId);
                    itemId = data.itemId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeSelectItemAction").data("itemid", "");
                }

                var quantity = data.quantity;
                if(isNaN(parseInt(data.quantity)))
                {
                    quantity = "";
                }
                this.contentElement.find(".gn-nodeItemQuantity").val(quantity);

                return itemId;
            }

            /**
             * Saves the data
             */
            Actions.ChangeInventoryAction.prototype.saveData = function() {
                var itemId = this.contentElement.find(".gn-nodeSelectItemAction").data("itemid");
                var quantity = parseInt(this.contentElement.find(".gn-nodeItemQuantity").val());
                if(isNaN(quantity))
                {
                    quantity = null;
                }

                var serializeData = {
                    itemId: itemId,
                    quantity: quantity
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));

                // Set related object data
                this.nodeModel.set("actionRelatedToObjectType", GoNorth.DefaultNodeShapes.Actions.RelatedToObjectItem);
                this.nodeModel.set("actionRelatedToObjectId", itemId);
            }

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Change Inventory choose npc Action
             * @class
             */
            Actions.ChangeInventoryChooseNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.ChangeInventoryChooseNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.ChangeInventoryChooseNpcAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeSelectItemAction gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenItem' title='" + DefaultNodeShapes.Localization.Actions.OpenItemTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" +
                        "<div class='gn-actionNodeObjectSelectionSeperator'>" + DefaultNodeShapes.Localization.Actions.InInventoryOf + "</div>" +
                        "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeSelectNpcAction gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenNpc' title='" + DefaultNodeShapes.Localization.Actions.OpenNpcTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" +
                        "<div class='gn-nodeActionText'>" + DefaultNodeShapes.Localization.Actions.ItemQuantity + "</div>" +
                        "<input type='text' class='gn-nodeItemQuantity'/>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ChangeInventoryChooseNpcAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;
                this.contentElement.find(".gn-nodeSelectItemAction").text(DefaultNodeShapes.Localization.Actions.ChooseItem);
                this.contentElement.find(".gn-nodeSelectNpcAction").text(DefaultNodeShapes.Localization.Actions.ChooseNpc);

                var itemOpenLink = contentElement.find(".gn-nodeActionOpenItem");
                var npcOpenLink = contentElement.find(".gn-nodeActionOpenNpc");

                // Deserialize
                var existingIds = this.deserializeData();
                var loadingDefs = [];
                if(existingIds.itemId)
                {
                    itemOpenLink.show();

                    var itemDef = new jQuery.Deferred();
                    loadingDefs.push(itemDef);
                    jQuery.ajax({ 
                        url: "/api/StyrApi/ResolveFlexFieldObjectNames", 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify([ existingIds.itemId ]), 
                        type: "POST",
                        contentType: "application/json"
                    }).done(function(itemNames) {
                        if(itemNames.length == 0)
                        {
                            itemDef.reject();
                            return;
                        }

                        contentElement.find(".gn-nodeSelectItemAction").text(itemNames[0].name);
                        itemDef.resolve();
                    }).fail(function(xhr) {
                        itemDef.reject();
                    });
                }

                if(existingIds.npcId)
                {
                    npcOpenLink.show();

                    var npcDef = new jQuery.Deferred();
                    loadingDefs.push(npcDef);
                    jQuery.ajax({ 
                        url: "/api/KortistoApi/ResolveFlexFieldObjectNames", 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify([ existingIds.npcId ]), 
                        type: "POST",
                        contentType: "application/json"
                    }).done(function(npcNames) {
                        if(npcNames.length == 0)
                        {
                            npcDef.reject();
                            return;
                        }

                        contentElement.find(".gn-nodeSelectNpcAction").text(npcNames[0].name);
                        npcDef.resolve();
                    }).fail(function(xhr) {
                        npcDef.reject();
                    });
                }

                if(loadingDefs.length > 0)
                {
                    actionNode.showLoading();
                    actionNode.hideError();
                    jQuery.when.apply(jQuery, loadingDefs).done(function() {
                        actionNode.hideLoading();
                    }).fail(function() {
                        actionNode.hideLoading();
                        actionNode.showError();
                    })
                }

                // Handlers
                var self = this;
                var selectItemAction = contentElement.find(".gn-nodeSelectItemAction");
                selectItemAction.on("click", function() {
                    DefaultNodeShapes.openItemSearchDialog().then(function(item) {
                        selectItemAction.data("itemid", item.id);
                        selectItemAction.text(item.name);
                        self.saveData();

                        itemOpenLink.show();
                    });
                });

                var selectNpcAction = contentElement.find(".gn-nodeSelectNpcAction");
                selectNpcAction.on("click", function() {
                    DefaultNodeShapes.openNpcSearchDialog().then(function(npc) {
                        selectNpcAction.data("npcid", npc.id);
                        selectNpcAction.text(npc.name);
                        self.saveData();

                        npcOpenLink.show();
                    });
                });  

                var itemQuantity = contentElement.find(".gn-nodeItemQuantity");
                itemQuantity.keydown(function(e) {
                    GoNorth.Util.validateNumberKeyPress(itemQuantity, e);
                });

                itemQuantity.change(function(e) {
                    self.ensureNumberValue();
                    self.saveData();
                });

                itemOpenLink.on("click", function() {
                    if(selectItemAction.data("itemid"))
                    {
                        window.open("/Styr/Item?id=" + selectItemAction.data("itemid"));
                    }
                });
                
                npcOpenLink.on("click", function() {
                    if(selectNpcAction.data("npcid"))
                    {
                        window.open("/Kortisto/Npc?id=" + selectNpcAction.data("npcid"));
                    }
                });
            };

            /**
             * Ensures a number value was entered for the item quantity
             */
            Actions.ChangeInventoryChooseNpcAction.prototype.ensureNumberValue = function() {
                var parsedValue = parseFloat(this.contentElement.find(".gn-nodeItemQuantity").val());
                if(isNaN(parsedValue))
                {
                    this.contentElement.find(".gn-nodeItemQuantity").val("");
                }
            };

            /**
             * Deserializes the data
             * @returns {object} Deserialized ids
             */
            Actions.ChangeInventoryChooseNpcAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                var itemId = "";
                if(data.itemId)
                {
                    this.contentElement.find(".gn-nodeSelectItemAction").data("itemid", data.itemId);
                    itemId = data.itemId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeSelectItemAction").data("itemid", "");
                }

                var npcId = "";
                if(data.npcId)
                {
                    this.contentElement.find(".gn-nodeSelectNpcAction").data("npcid", data.npcId);
                    npcId = data.npcId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeSelectNpcAction").data("npcid", "");
                }

                var quantity = data.quantity;
                if(isNaN(parseInt(data.quantity)))
                {
                    quantity = "";
                }
                this.contentElement.find(".gn-nodeItemQuantity").val(quantity);

                return {
                    itemId: itemId,
                    npcId: npcId
                };
            }

            /**
             * Saves the data
             */
            Actions.ChangeInventoryChooseNpcAction.prototype.saveData = function() {
                var itemId = this.contentElement.find(".gn-nodeSelectItemAction").data("itemid");
                var npcId = this.contentElement.find(".gn-nodeSelectNpcAction").data("npcid");
                var quantity = parseInt(this.contentElement.find(".gn-nodeItemQuantity").val());
                if(isNaN(quantity))
                {
                    quantity = null;
                }

                var serializeData = {
                    itemId: itemId,
                    npcId: npcId,
                    quantity: quantity
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));

                // Set related object data
                this.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectItem);
                this.nodeModel.set("actionRelatedToObjectId", itemId);

                var additionalRelatedObjects = [];
                if(npcId)
                {
                    additionalRelatedObjects.push({
                        objectType: Actions.RelatedToObjectNpc,
                        objectId: npcId
                    });
                }

                this.nodeModel.set("actionRelatedToAdditionalObjects", additionalRelatedObjects);
            }

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for spawning an item in the player inventory
            var actionTypeSpawnItemInPlayerInventory = 3;

            /**
             * Spawn item in player inventory Action
             * @class
             */
            Actions.SpawnItemInPlayerInventoryAction = function()
            {
                Actions.ChangeInventoryAction.apply(this);
            };

            Actions.SpawnItemInPlayerInventoryAction.prototype = jQuery.extend({ }, Actions.ChangeInventoryAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SpawnItemInPlayerInventoryAction.prototype.buildAction = function() {
                return new Actions.SpawnItemInPlayerInventoryAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SpawnItemInPlayerInventoryAction.prototype.getType = function() {
                return actionTypeSpawnItemInPlayerInventory;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SpawnItemInPlayerInventoryAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SpawnItemInPlayerInventoryLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SpawnItemInPlayerInventoryAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for spawning an item in the npc inventory
            var actionTypeSpawnItemInNpcInventory = 4;

            /**
             * Spawn item in npc inventory Action
             * @class
             */
            Actions.SpawnItemInNpcInventoryAction = function()
            {
                Actions.ChangeInventoryAction.apply(this);
            };

            Actions.SpawnItemInNpcInventoryAction.prototype = jQuery.extend({ }, Actions.ChangeInventoryAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SpawnItemInNpcInventoryAction.prototype.buildAction = function() {
                return new Actions.SpawnItemInNpcInventoryAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SpawnItemInNpcInventoryAction.prototype.getType = function() {
                return actionTypeSpawnItemInNpcInventory;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SpawnItemInNpcInventoryAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SpawnItemInNpcInventoryLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SpawnItemInNpcInventoryAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for spawning an item in the npc inventory of an npc that can be chosen
            var actionTypeSpawnItemInChooseNpcInventory = 51;

            /**
             * Spawn item in choose npc inventory Action
             * @class
             */
            Actions.SpawnItemInChooseNpcInventoryAction = function()
            {
                Actions.ChangeInventoryChooseNpcAction.apply(this);
            };

            Actions.SpawnItemInChooseNpcInventoryAction.prototype = jQuery.extend({ }, Actions.ChangeInventoryChooseNpcAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SpawnItemInChooseNpcInventoryAction.prototype.buildAction = function() {
                return new Actions.SpawnItemInChooseNpcInventoryAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SpawnItemInChooseNpcInventoryAction.prototype.getType = function() {
                return actionTypeSpawnItemInChooseNpcInventory;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SpawnItemInChooseNpcInventoryAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SpawnItemInChooseNpcInventoryLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SpawnItemInChooseNpcInventoryAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for transfering an item from the npc inventory to the player inventory
            var actionTypeTransferItemToPlayerInventory = 5;

            /**
             * Transfer item from the npc inventory to the player inventory Action
             * @class
             */
            Actions.TransferItemToPlayerInventoryAction = function()
            {
                Actions.ChangeInventoryAction.apply(this);
            };

            Actions.TransferItemToPlayerInventoryAction.prototype = jQuery.extend({ }, Actions.ChangeInventoryAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.TransferItemToPlayerInventoryAction.prototype.buildAction = function() {
                return new Actions.TransferItemToPlayerInventoryAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.TransferItemToPlayerInventoryAction.prototype.getType = function() {
                return actionTypeTransferItemToPlayerInventory;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.TransferItemToPlayerInventoryAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TransferItemToPlayerInventoryLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.TransferItemToPlayerInventoryAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for transfering an item from the player inventory to the npc inventory
            var actionTypeTransferItemToNpcInventory = 6;

            /**
             * Transfer item from the player inventory to the npc inventory Action
             * @class
             */
            Actions.TransferItemNpcInventoryAction = function()
            {
                Actions.ChangeInventoryAction.apply(this);
            };

            Actions.TransferItemNpcInventoryAction.prototype = jQuery.extend({ }, Actions.ChangeInventoryAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.TransferItemNpcInventoryAction.prototype.buildAction = function() {
                return new Actions.TransferItemNpcInventoryAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.TransferItemNpcInventoryAction.prototype.getType = function() {
                return actionTypeTransferItemToNpcInventory;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.TransferItemNpcInventoryAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TransferItemToNpcInventoryLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.TransferItemNpcInventoryAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for remove an item from the npc inventory
            var actionTypeRemoveItemFromNpcInventory = 34;

            /**
             * Remove item from npc inventory Action
             * @class
             */
            Actions.RemoveItemFromNpcInventoryAction = function()
            {
                Actions.ChangeInventoryAction.apply(this);
            };

            Actions.RemoveItemFromNpcInventoryAction.prototype = jQuery.extend({ }, Actions.ChangeInventoryAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.RemoveItemFromNpcInventoryAction.prototype.buildAction = function() {
                return new Actions.RemoveItemFromNpcInventoryAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.RemoveItemFromNpcInventoryAction.prototype.getType = function() {
                return actionTypeRemoveItemFromNpcInventory;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.RemoveItemFromNpcInventoryAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.RemoveItemFromNpcInventoryLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.RemoveItemFromNpcInventoryAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for remove an item from the player inventory
            var actionTypeRemoveItemFromPlayerInventory = 35;

            /**
             * Remove item from player inventory Action
             * @class
             */
            Actions.RemoveItemFromPlayerInventoryAction = function()
            {
                Actions.ChangeInventoryAction.apply(this);
            };

            Actions.RemoveItemFromPlayerInventoryAction.prototype = jQuery.extend({ }, Actions.ChangeInventoryAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.RemoveItemFromPlayerInventoryAction.prototype.buildAction = function() {
                return new Actions.RemoveItemFromPlayerInventoryAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.RemoveItemFromPlayerInventoryAction.prototype.getType = function() {
                return actionTypeRemoveItemFromPlayerInventory;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.RemoveItemFromPlayerInventoryAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.RemoveItemFromPlayerInventoryLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.RemoveItemFromPlayerInventoryAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for removing an item in the npc inventory of an npc that can be chosen
            var actionTypeRemoveItemFromChooseNpcInventory = 52;

            /**
             * Remove item from choose npc inventory Action
             * @class
             */
            Actions.RemoveItemFromChooseNpcInventoryAction = function()
            {
                Actions.ChangeInventoryChooseNpcAction.apply(this);
            };

            Actions.RemoveItemFromChooseNpcInventoryAction.prototype = jQuery.extend({ }, Actions.ChangeInventoryChooseNpcAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.RemoveItemFromChooseNpcInventoryAction.prototype.buildAction = function() {
                return new Actions.RemoveItemFromChooseNpcInventoryAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.RemoveItemFromChooseNpcInventoryAction.prototype.getType = function() {
                return actionTypeRemoveItemFromChooseNpcInventory;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.RemoveItemFromChooseNpcInventoryAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.RemoveItemFromChooseNpcInventoryLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.RemoveItemFromChooseNpcInventoryAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Object Use Item Action
             * @class
             */
            Actions.ObjectUseItemAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.ObjectUseItemAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.ObjectUseItemAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeSelectItemAction gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenItem' title='" + DefaultNodeShapes.Localization.Actions.OpenItemTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ObjectUseItemAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;
                this.contentElement.find(".gn-nodeSelectItemAction").text(DefaultNodeShapes.Localization.Actions.ChooseItem);

                var itemOpenLink = contentElement.find(".gn-nodeActionOpenItem");

                // Deserialize
                var existingItemId = this.deserializeData();
                if(existingItemId)
                {
                    itemOpenLink.show();

                    actionNode.showLoading();
                    actionNode.hideError();
                    jQuery.ajax({ 
                        url: "/api/StyrApi/ResolveFlexFieldObjectNames", 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify([ existingItemId ]), 
                        type: "POST",
                        contentType: "application/json"
                    }).done(function(itemNames) {
                        if(itemNames.length == 0)
                        {
                            actionNode.hideLoading();
                            actionNode.showError();
                            return;
                        }

                        contentElement.find(".gn-nodeSelectItemAction").text(itemNames[0].name);
                        actionNode.hideLoading();
                    }).fail(function(xhr) {
                        actionNode.hideLoading();
                        actionNode.showError();
                    });
                }

                // Handlers
                var self = this;
                var selectItemAction = contentElement.find(".gn-nodeSelectItemAction");
                contentElement.find(".gn-nodeSelectItemAction").on("click", function() {
                    DefaultNodeShapes.openItemSearchDialog().then(function(item) {
                        selectItemAction.data("itemid", item.id);
                        selectItemAction.text(item.name);
                        self.saveData();

                        itemOpenLink.show();
                    });
                });

                itemOpenLink.on("click", function() {
                    if(selectItemAction.data("itemid"))
                    {
                        window.open("/Styr/Item?id=" + selectItemAction.data("itemid"));
                    }
                });
            };

            /**
             * Deserializes the data
             * @returns {string} Deserialized item id
             */
            Actions.ObjectUseItemAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                var itemId = "";
                if(data.itemId)
                {
                    this.contentElement.find(".gn-nodeSelectItemAction").data("itemid", data.itemId);
                    itemId = data.itemId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeSelectItemAction").data("itemid", "");
                }

                return itemId;
            }

            /**
             * Saves the data
             */
            Actions.ObjectUseItemAction.prototype.saveData = function() {
                var itemId = this.contentElement.find(".gn-nodeSelectItemAction").data("itemid");

                var serializeData = {
                    itemId: itemId
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));

                // Set related object data
                this.nodeModel.set("actionRelatedToObjectType", GoNorth.DefaultNodeShapes.Actions.RelatedToObjectItem);
                this.nodeModel.set("actionRelatedToObjectId", itemId);
            }

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for the npc using an item
            var actionTypeNpcUseItem = 53;

            /**
             * Npc uses an item action
             * @class
             */
            Actions.NpcUseItemAction = function()
            {
                Actions.ObjectUseItemAction.apply(this);
            };

            Actions.NpcUseItemAction.prototype = jQuery.extend({ }, Actions.ObjectUseItemAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.NpcUseItemAction.prototype.buildAction = function() {
                return new Actions.NpcUseItemAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.NpcUseItemAction.prototype.getType = function() {
                return actionTypeNpcUseItem;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.NpcUseItemAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.NpcUseItemLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.NpcUseItemAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for the player using an item
            var actionTypePlayerUseItem = 54;

            /**
             * Player uses an item action
             * @class
             */
            Actions.PlayerUseItemAction = function()
            {
                Actions.ObjectUseItemAction.apply(this);
            };

            Actions.PlayerUseItemAction.prototype = jQuery.extend({ }, Actions.ObjectUseItemAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.PlayerUseItemAction.prototype.buildAction = function() {
                return new Actions.PlayerUseItemAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.PlayerUseItemAction.prototype.getType = function() {
                return actionTypePlayerUseItem;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.PlayerUseItemAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.PlayerUseItemLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.PlayerUseItemAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for a choose npc using an item
            var actionTypeNpcUseItem = 55;

            /**
             * Choose Npc Use Item Action
             * @class
             */
            Actions.ChooseNpcUseItemAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.ChooseNpcUseItemAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ChooseNpcUseItemAction.prototype.buildAction = function() {
                return new Actions.ChooseNpcUseItemAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ChooseNpcUseItemAction.prototype.getType = function() {
                return actionTypeNpcUseItem;
            };
            
            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ChooseNpcUseItemAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseNpcUseItemLabel;
            };

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.ChooseNpcUseItemAction.prototype.getContent = function() {
                return "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeSelectNpcAction gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenNpc' title='" + DefaultNodeShapes.Localization.Actions.OpenNpcTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" +
                        "<div class='gn-nodeActionText'>" + DefaultNodeShapes.Localization.Actions.UsesItem + "</div>" +
                        "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeSelectItemAction gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenItem' title='" + DefaultNodeShapes.Localization.Actions.OpenItemTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ChooseNpcUseItemAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;
                this.contentElement.find(".gn-nodeSelectNpcAction").text(DefaultNodeShapes.Localization.Actions.ChooseNpc);
                this.contentElement.find(".gn-nodeSelectItemAction").text(DefaultNodeShapes.Localization.Actions.ChooseItem);

                var npcOpenLink = contentElement.find(".gn-nodeActionOpenNpc");
                var itemOpenLink = contentElement.find(".gn-nodeActionOpenItem");

                // Deserialize
                var existingIds = this.deserializeData();
                var loadingDefs = [];
                if(existingIds.itemId)
                {
                    itemOpenLink.show();
                    
                    var itemDef = new jQuery.Deferred();
                    loadingDefs.push(itemDef);
                    jQuery.ajax({ 
                        url: "/api/StyrApi/ResolveFlexFieldObjectNames", 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify([ existingIds.itemId ]), 
                        type: "POST",
                        contentType: "application/json"
                    }).done(function(itemNames) {
                        if(itemNames.length == 0)
                        {
                            itemDef.reject();
                            return;
                        }

                        contentElement.find(".gn-nodeSelectItemAction").text(itemNames[0].name);
                        itemDef.resolve();
                    }).fail(function(xhr) {
                        itemDef.reject();
                    });
                }

                if(existingIds.npcId)
                {
                    npcOpenLink.show();

                    var npcDef = new jQuery.Deferred();
                    loadingDefs.push(npcDef);
                    jQuery.ajax({ 
                        url: "/api/KortistoApi/ResolveFlexFieldObjectNames", 
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify([ existingIds.npcId ]), 
                        type: "POST",
                        contentType: "application/json"
                    }).done(function(npcNames) {
                        if(npcNames.length == 0)
                        {
                            npcDef.reject();
                            return;
                        }

                        contentElement.find(".gn-nodeSelectNpcAction").text(npcNames[0].name);
                        npcDef.resolve();
                    }).fail(function(xhr) {
                        npcDef.reject();
                    });
                }

                if(loadingDefs.length > 0)
                {
                    actionNode.showLoading();
                    actionNode.hideError();
                    jQuery.when.apply(jQuery, loadingDefs).done(function() {
                        actionNode.hideLoading();
                    }).fail(function() {
                        actionNode.hideLoading();
                        actionNode.showError();
                    })
                }

                // Handlers
                var self = this;
                var selectNpcAction = contentElement.find(".gn-nodeSelectNpcAction");
                selectNpcAction.on("click", function() {
                    DefaultNodeShapes.openNpcSearchDialog().then(function(npc) {
                        selectNpcAction.data("npcid", npc.id);
                        selectNpcAction.text(npc.name);
                        self.saveData();

                        npcOpenLink.show();
                    });
                });  

                var selectItemAction = contentElement.find(".gn-nodeSelectItemAction");
                contentElement.find(".gn-nodeSelectItemAction").on("click", function() {
                    DefaultNodeShapes.openItemSearchDialog().then(function(item) {
                        selectItemAction.data("itemid", item.id);
                        selectItemAction.text(item.name);
                        self.saveData();

                        itemOpenLink.show();
                    });
                });

                itemOpenLink.on("click", function() {
                    if(selectItemAction.data("itemid"))
                    {
                        window.open("/Styr/Item?id=" + selectItemAction.data("itemid"));
                    }
                });   

                npcOpenLink.on("click", function() {
                    if(selectNpcAction.data("npcid"))
                    {
                        window.open("/Kortisto/Npc?id=" + selectNpcAction.data("npcid"));
                    }
                });
            };

            /**
             * Deserializes the data
             * @returns {string} Deserialized item id
             */
            Actions.ChooseNpcUseItemAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                var itemId = "";
                if(data.itemId)
                {
                    this.contentElement.find(".gn-nodeSelectItemAction").data("itemid", data.itemId);
                    itemId = data.itemId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeSelectItemAction").data("itemid", "");
                }

                var npcId = "";
                if(data.npcId)
                {
                    this.contentElement.find(".gn-nodeSelectNpcAction").data("npcid", data.npcId);
                    npcId = data.npcId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeSelectNpcAction").data("npcid", "");
                }

                return {
                    itemId: itemId,
                    npcId: npcId
                };
            }

            /**
             * Saves the data
             */
            Actions.ChooseNpcUseItemAction.prototype.saveData = function() {
                var npcId = this.contentElement.find(".gn-nodeSelectNpcAction").data("npcid");
                var itemId = this.contentElement.find(".gn-nodeSelectItemAction").data("itemid");

                var serializeData = {
                    npcId: npcId,
                    itemId: itemId
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));

                // Set related object data
                this.nodeModel.set("actionRelatedToObjectType", GoNorth.DefaultNodeShapes.Actions.RelatedToObjectItem);
                this.nodeModel.set("actionRelatedToObjectId", itemId);
            }

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ChooseNpcUseItemAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for changing a quest value
            var actionTypeChangeQuestValue = 8;

            /**
             * Change quest value Action
             * @class
             */
            Actions.ChangeQuestValueAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ChangeValueChooseObjectAction.apply(this);
            };

            Actions.ChangeQuestValueAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ChangeValueChooseObjectAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ChangeQuestValueAction.prototype.buildAction = function() {
                return new Actions.ChangeQuestValueAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ChangeQuestValueAction.prototype.getType = function() {
                return actionTypeChangeQuestValue;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ChangeQuestValueAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChangeQuestValueLabel;
            };

            /**
             * Returns the choose object label
             * 
             * @returns {string} Choose object label
             */
            Actions.ChangeQuestValueAction.prototype.getChooseLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseQuestLabel;
            };

            /**
             * Returns the open object tool label
             * 
             * @returns {string} Open object label
             */
            Actions.ChangeQuestValueAction.prototype.getOpenObjectTooltip = function() {
                return DefaultNodeShapes.Localization.Actions.OpenQuestTooltip;
            };

            /**
             * Opens the object
             * @param {string} id Id of the object
             */
            Actions.ChangeQuestValueAction.prototype.openObject = function(id) {
                window.open("/Aika/Quest?id=" + encodeURIComponent(id));
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.ChangeQuestValueAction.prototype.getObjectTypeName = function() {
                return Actions.RelatedToObjectQuest;
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ChangeQuestValueAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceQuest;
            };

            /**
             * Opens the search dialog
             * 
             * @returns {jQuery.Deferred} Deferred for the picking
             */
            Actions.ChangeQuestValueAction.prototype.openSearchDialog = function() {
                return GoNorth.DefaultNodeShapes.openQuestSearchDialog();
            };

            /**
             * Loads the quest
             * 
             * @returns {jQuery.Deferred} Deferred for the quest loading
             */
            Actions.ChangeQuestValueAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();

                var self = this;
                jQuery.ajax({ 
                    url: "/api/AikaApi/GetQuest?id=" + this.nodeModel.get("objectId"), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ChangeQuestValueAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for changing a quest state
            Actions.actionTypeChangeQuestState = 9;

            /**
             * Set Quest State Action
             * @class
             */
            Actions.SetQuestStateAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.SetQuestStateAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.SetQuestStateAction.prototype = jQuery.extend(Actions.SetQuestStateAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.SetQuestStateAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeActionSelectQuest gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenQuest' title='" + DefaultNodeShapes.Localization.Actions.OpenQuestTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" +
                        "<div class='gn-nodeActionText'>" + DefaultNodeShapes.Localization.Actions.QuestState + "</div>" +
                        "<select class='gn-nodeActionQuestState'></select>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.SetQuestStateAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;
                this.contentElement.find(".gn-nodeActionSelectQuest").html(DefaultNodeShapes.Localization.Actions.ChooseQuestLabel);
                GoNorth.Util.fillSelectFromArray(this.contentElement.find(".gn-nodeActionQuestState"), DefaultNodeShapes.Shapes.getQuestStates(), function(questState) { return questState.questState; }, function(questState) { return questState.label; });

                var questOpenLink = contentElement.find(".gn-nodeActionOpenQuest");

                // Deserialize
                var existingQuestId = this.deserializeData();
                if(existingQuestId)
                {
                    questOpenLink.show();

                    actionNode.showLoading();
                    actionNode.hideError();

                    this.loadObjectShared(existingQuestId).then(function(quest) {
                        contentElement.find(".gn-nodeActionSelectQuest").text(quest.name);
                        actionNode.hideLoading();
                    }).fail(function(xhr) {
                        actionNode.hideLoading();
                        actionNode.showError();
                    });
                }

                // Handlers
                var self = this;
                var selectQuestAction = contentElement.find(".gn-nodeActionSelectQuest");
                contentElement.find(".gn-nodeActionSelectQuest").on("click", function() {
                    DefaultNodeShapes.openQuestSearchDialog().then(function(quest) {
                        selectQuestAction.data("questid", quest.id);
                        selectQuestAction.text(quest.name);
                        self.saveData();

                        questOpenLink.show();
                    });
                });

                var questState = contentElement.find(".gn-nodeActionQuestState");
                questState.change(function(e) {
                    self.saveData();
                });

                questOpenLink.on("click", function() {
                    if(selectQuestAction.data("questid"))
                    {
                        window.open("/Aika/Quest?id=" + selectQuestAction.data("questid"));
                    }
                });
            };

            /**
             * Deserializes the data
             * 
             * @returns {string} Id of the selected quest
             */
            Actions.SetQuestStateAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                var questId = "";
                if(data.questId)
                {
                    this.contentElement.find(".gn-nodeActionSelectQuest").data("questid", data.questId);
                    questId = data.questId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeActionSelectQuest").data("questid", "");
                }

                this.contentElement.find(".gn-nodeActionQuestState").find("option[value='" + data.questState + "']").prop("selected", true);

                return questId;
            }

            /**
             * Saves the data
             */
            Actions.SetQuestStateAction.prototype.saveData = function() {
                // The serialized data is also used in the Aika changeQuestStateInNpcDialogAction. If anything changes this must be taken into consideration.
                
                var questId = this.getObjectId();
                var questState = this.contentElement.find(".gn-nodeActionQuestState").val();
                var serializeData = {
                    questId: questId,
                    questState: questState
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));

                // Set related object data
                this.nodeModel.set("actionRelatedToObjectType", this.getObjectTypeName());
                this.nodeModel.set("actionRelatedToObjectId", questId);
            }

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SetQuestStateAction.prototype.buildAction = function() {
                return new Actions.SetQuestStateAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SetQuestStateAction.prototype.getType = function() {
                return Actions.actionTypeChangeQuestState;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SetQuestStateAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SetQuestStateLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.SetQuestStateAction.prototype.getObjectTypeName = function() {
                return Actions.RelatedToObjectQuest;
            };

            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.SetQuestStateAction.prototype.getObjectId = function() {
                return this.contentElement.find(".gn-nodeActionSelectQuest").data("questid");
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.SetQuestStateAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceQuest;
            };

            /**
             * Loads the quest
             * 
             * @param {string} questId Quest Id
             * @returns {jQuery.Deferred} Deferred for the quest loading
             */
            Actions.SetQuestStateAction.prototype.loadObject = function(questId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/AikaApi/GetQuest?id=" + questId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SetQuestStateAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for adding text to a quest
            Actions.actionTypeAddQuestToText = 10;

            /**
             * Add Text to Quest Action
             * @class
             */
            Actions.AddQuestTextAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.AddQuestTextAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.AddQuestTextAction.prototype = jQuery.extend(Actions.AddQuestTextAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.AddQuestTextAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeActionSelectQuest gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenQuest' title='" + DefaultNodeShapes.Localization.Actions.OpenQuestTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" +
                        "<div class='gn-nodeActionText'>" + DefaultNodeShapes.Localization.Actions.QuestText + "</div>" +
                        "<textarea class='gn-nodeActionQuestText'></textarea>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.AddQuestTextAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;
                this.contentElement.find(".gn-nodeActionSelectQuest").html(DefaultNodeShapes.Localization.Actions.ChooseQuestLabel);

                var questOpenLink = contentElement.find(".gn-nodeActionOpenQuest");

                // Deserialize
                var existingQuestId = this.deserializeData();
                if(existingQuestId)
                {
                    questOpenLink.show();

                    actionNode.showLoading();
                    actionNode.hideError();

                    this.loadObjectShared(existingQuestId).then(function(quest) {
                        contentElement.find(".gn-nodeActionSelectQuest").text(quest.name);
                        actionNode.hideLoading();
                    }).fail(function(xhr) {
                        actionNode.hideLoading();
                        actionNode.showError();
                    });
                }

                // Handlers
                var self = this;
                var selectQuestAction = contentElement.find(".gn-nodeActionSelectQuest");
                contentElement.find(".gn-nodeActionSelectQuest").on("click", function() {
                    DefaultNodeShapes.openQuestSearchDialog().then(function(quest) {
                        selectQuestAction.data("questid", quest.id);
                        selectQuestAction.text(quest.name);
                        self.saveData();
                        
                        questOpenLink.show();
                    });
                });

                var questText = contentElement.find(".gn-nodeActionQuestText");
                questText.change(function(e) {
                    self.saveData();
                });

                questOpenLink.on("click", function() {
                    if(selectQuestAction.data("questid"))
                    {
                        window.open("/Aika/Quest?id=" + selectQuestAction.data("questid"));
                    }
                });
            };

            /**
             * Deserializes the data
             */
            Actions.AddQuestTextAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                var questId = "";
                if(data.questId)
                {
                    this.contentElement.find(".gn-nodeActionSelectQuest").data("questid", data.questId);
                    questId = data.questId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeActionSelectQuest").data("questid", "");
                }

                this.contentElement.find(".gn-nodeActionQuestText").val(data.questText);

                return questId;
            }

            /**
             * Saves the data
             */
            Actions.AddQuestTextAction.prototype.saveData = function() {
                // The serialized data is also used in the Aika changeQuestTextInNpcDialogAction. If anything changes this must be taken into consideration.
                
                var questId = this.getObjectId();
                var questText = this.contentElement.find(".gn-nodeActionQuestText").val();
                var serializeData = {
                    questId: questId,
                    questText: questText
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));

                // Set related object data
                this.nodeModel.set("actionRelatedToObjectType", GoNorth.DefaultNodeShapes.Actions.RelatedToObjectQuest);
                this.nodeModel.set("actionRelatedToObjectId", questId);
            }

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.AddQuestTextAction.prototype.buildAction = function() {
                return new Actions.AddQuestTextAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.AddQuestTextAction.prototype.getType = function() {
                return Actions.actionTypeAddQuestToText;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.AddQuestTextAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.AddQuestTextLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.AddQuestTextAction.prototype.getObjectTypeName = function() {
                return Actions.RelatedToObjectQuest;
            };

            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.AddQuestTextAction.prototype.getObjectId = function() {
                return this.contentElement.find(".gn-nodeActionSelectQuest").data("questid");
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.AddQuestTextAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceQuest;
            };

            /**
             * Loads the quest
             * 
             * @param {string} questId Quest Id
             * @returns {jQuery.Deferred} Deferred for the quest loading
             */
            Actions.AddQuestTextAction.prototype.loadObject = function(questId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/AikaApi/GetQuest?id=" + questId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.AddQuestTextAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for waiting
            var actionTypeWait = 14;


            /// Wait Type for Waiting in Real Time
            var waitTypeRealTime = 0;

            /// Wait Type for Waiting in Game Time
            var waitTypeGameTime = 1;


            /// Wait unit for milliseconds
            var waitUnitMilliseconds = 0;

            /// Wait unit for seconds
            var waitUnitSeconds = 1;
            
            /// Wait unit for minutes
            var waitUnitMinutes = 2;

            /// Wait unit for hours
            var waitUnitHours = 3;
            
            /// Wait unit for days
            var waitUnitDays = 4;



            /**
             * Wait Action
             * @class
             */
            Actions.WaitAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.WaitAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.WaitAction.prototype.getContent = function() {
                return  "<input type='text' class='gn-actionNodeWaitAmount'/>" + 
                        "<select class='gn-actionNodeWaitType'></select>" +
                        "<select class='gn-actionNodeWaitUnit'></select>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.WaitAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                this.contentElement.find(".gn-actionNodeWaitAmount").val("0");

                var availableWaitTypes = [
                    {
                        label: DefaultNodeShapes.Localization.Actions.WaitTypeRealTime,
                        value: waitTypeRealTime
                    },
                    {
                        label: DefaultNodeShapes.Localization.Actions.WaitTypeGameTime,
                        value: waitTypeGameTime
                    }
                ];
                var waitType = contentElement.find(".gn-actionNodeWaitType");
                GoNorth.Util.fillSelectFromArray(waitType, availableWaitTypes, function(waitType) { return waitType.value; }, function(waitType) { return waitType.label; });

                var self = this;
                waitType.on("change", function() {
                    self.syncTimeUnits();
                    self.serialize();
                });

                this.syncTimeUnits();
                contentElement.find(".gn-actionNodeWaitUnit").on("change", function() {
                    self.serialize();
                });

                var waitAmount = contentElement.find(".gn-actionNodeWaitAmount");
                waitAmount.keydown(function(e) {
                    GoNorth.Util.validateNumberKeyPress(waitAmount, e);
                });

                waitAmount.change(function(e) {
                    if(self.isNumberValueSelected)
                    {
                        self.ensureNumberValue();
                    }

                    self.serialize();
                });

                this.deserialize();
            };

            /**
             * Syncs the time units
             */
            Actions.WaitAction.prototype.syncTimeUnits = function() {
                var availableUnits = [
                    {
                        label: DefaultNodeShapes.Localization.Actions.WaitUnitMilliseconds,
                        value: waitUnitMilliseconds
                    },
                    {
                        label: DefaultNodeShapes.Localization.Actions.WaitUnitSeconds,
                        value: waitUnitSeconds
                    },
                    {
                        label: DefaultNodeShapes.Localization.Actions.WaitUnitMinutes,
                        value: waitUnitMinutes
                    }
                ];

                if(this.contentElement.find(".gn-actionNodeWaitType").val() == waitTypeGameTime)
                {
                    availableUnits = [
                        {
                            label: DefaultNodeShapes.Localization.Actions.WaitUnitMinutes,
                            value: waitUnitMinutes
                        },
                        {
                            label: DefaultNodeShapes.Localization.Actions.WaitUnitHours,
                            value: waitUnitHours
                        },
                        {
                            label: DefaultNodeShapes.Localization.Actions.WaitUnitDays,
                            value: waitUnitDays
                        }
                    ];
                }

                GoNorth.Util.fillSelectFromArray(this.contentElement.find(".gn-actionNodeWaitUnit"), availableUnits, function(waitType) { return waitType.value; }, function(waitType) { return waitType.label; });
            };

            /**
             * Ensures the user entered a number if a number field was selected
             */
            Actions.WaitAction.prototype.ensureNumberValue = function() {
                var parsedValue = parseFloat(this.contentElement.find(".gn-actionNodeWaitAmount").val());
                if(isNaN(parsedValue))
                {
                    this.contentElement.find(".gn-actionNodeWaitAmount").val("0");
                }
            };

            /**
             * Deserializes the data
             */
            Actions.WaitAction.prototype.deserialize = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                this.contentElement.find(".gn-actionNodeWaitAmount").val(data.waitAmount);
                this.contentElement.find(".gn-actionNodeWaitType").find("option[value='" + data.waitType + "']").prop("selected", true);
                this.syncTimeUnits();
                this.contentElement.find(".gn-actionNodeWaitUnit").find("option[value='" + data.waitUnit + "']").prop("selected", true);
            };

            /**
             * Saves the data
             */
            Actions.WaitAction.prototype.serialize = function() {
                var waitAmount = parseFloat(this.contentElement.find(".gn-actionNodeWaitAmount").val());
                if(isNaN(waitAmount))
                {
                    waitAmount = 0;
                }

                var waitType = this.contentElement.find(".gn-actionNodeWaitType").val();
                var waitUnit = this.contentElement.find(".gn-actionNodeWaitUnit").val();

                var serializeData = {
                    waitAmount: waitAmount,
                    waitType: waitType,
                    waitUnit: waitUnit
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            /**
             * Returns the label for the main output
             * 
             * @returns {string} Label for the main output
             */
            Actions.WaitAction.prototype.getMainOutputLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WaitLaterContinueLabel;
            };

            /**
             * Returns the additional outports of the action
             * 
             * @returns {string[]} Additional outports
             */
            Actions.WaitAction.prototype.getAdditionalOutports = function() {
                return [ DefaultNodeShapes.Localization.Actions.WaitDirectContinueLabel ];
            };

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.WaitAction.prototype.buildAction = function() {
                return new Actions.WaitAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.WaitAction.prototype.getType = function() {
                return actionTypeWait;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.WaitAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WaitLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.WaitAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Set Object State Action
             * @class
             */
            Actions.SetObjectStateAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.SetObjectStateAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.SetObjectStateAction.prototype.getContent = function() {
                return  "<input type='text' class='gn-nodeActionObjectState' placeholder='" + DefaultNodeShapes.Localization.Actions.StatePlaceholder + "' list='gn-" + GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction + "'/>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.SetObjectStateAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                // Deserialize
                this.deserializeData();

                // Handlers
                var self = this;
                var objectState = contentElement.find(".gn-nodeActionObjectState");
                objectState.change(function(e) {
                    self.saveData();
                });
            };

            /**
             * Deserializes the data
             */
            Actions.SetObjectStateAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                this.contentElement.find(".gn-nodeActionObjectState").val(data.objectState);
            }

            /**
             * Saves the data
             */
            Actions.SetObjectStateAction.prototype.saveData = function() {
                var objectState = this.contentElement.find(".gn-nodeActionObjectState").val();
                var serializeData = {
                    objectState: objectState
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            }

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SetObjectStateAction.prototype.buildAction = function() {
                return new Actions.SetObjectStateAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SetObjectStateAction.prototype.getType = function() {
                return -1;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SetObjectStateAction.prototype.getLabel = function() {
                return "";
            };

            /**
             * Returns the config key for the action
             * 
             * @returns {string} Config key
             */
            Actions.SetObjectStateAction.prototype.getConfigKey = function() {
                return GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction;
            }

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for changing the player state
            var actionTypeChangePlayerState = 15;

            /**
             * Change player state Action
             * @class
             */
            Actions.SetPlayerStateAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.SetObjectStateAction.apply(this);
            };

            Actions.SetPlayerStateAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.SetObjectStateAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SetPlayerStateAction.prototype.buildAction = function() {
                return new Actions.SetPlayerStateAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SetPlayerStateAction.prototype.getType = function() {
                return actionTypeChangePlayerState;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SetPlayerStateAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SetPlayerStateLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SetPlayerStateAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for changing the npc state
            var actionTypeChangeNpcState = 17;

            /**
             * Change npc state Action
             * @class
             */
            Actions.SetNpcStateAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.SetObjectStateAction.apply(this);
            };

            Actions.SetNpcStateAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.SetObjectStateAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SetNpcStateAction.prototype.buildAction = function() {
                return new Actions.SetNpcStateAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SetNpcStateAction.prototype.getType = function() {
                return actionTypeChangeNpcState;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SetNpcStateAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SetNpcStateLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SetNpcStateAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Learn or Forget a Skill Action
             * @class
             */
            Actions.LearnForgetSkillAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.LearnForgetSkillAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.LearnForgetSkillAction.prototype = jQuery.extend(Actions.LearnForgetSkillAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.LearnForgetSkillAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'>" + 
                            "<a class='gn-clickable gn-nodeActionSelectSkill gn-nodeNonClickableOnReadonly'></a>&nbsp;" +
                            "<a class='gn-clickable gn-nodeActionOpenSkill' title='" + DefaultNodeShapes.Localization.Actions.OpenSkillTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.LearnForgetSkillAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;
                this.contentElement.find(".gn-nodeActionSelectSkill").html(DefaultNodeShapes.Localization.Actions.ChooseSkillLabel);

                var skillOpenLink = contentElement.find(".gn-nodeActionOpenSkill");

                // Deserialize
                var existingSkillId = this.deserializeData();
                if(existingSkillId)
                {
                    skillOpenLink.show();

                    actionNode.showLoading();
                    actionNode.hideError();

                    this.loadObjectShared(existingSkillId).then(function(skill) {
                        contentElement.find(".gn-nodeActionSelectSkill").text(skill.name);
                        actionNode.hideLoading();
                    }).fail(function(xhr) {
                        actionNode.hideLoading();
                        actionNode.showError();
                    });
                }

                // Handlers
                var self = this;
                var selectSkillAction = contentElement.find(".gn-nodeActionSelectSkill");
                contentElement.find(".gn-nodeActionSelectSkill").on("click", function() {
                    DefaultNodeShapes.openSkillSearchDialog().then(function(skill) {
                        selectSkillAction.data("skillid", skill.id);
                        selectSkillAction.text(skill.name);
                        self.saveData();

                        skillOpenLink.show();
                    });
                });

                skillOpenLink.on("click", function() {
                    if(selectSkillAction.data("skillid"))
                    {
                        window.open("/Evne/Skill?id=" + selectSkillAction.data("skillid"));
                    }
                });
            };

            /**
             * Deserializes the data
             * 
             * @returns {string} Id of the selected skill
             */
            Actions.LearnForgetSkillAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                var skillId = "";
                if(data.skillId)
                {
                    this.contentElement.find(".gn-nodeActionSelectSkill").data("skillid", data.skillId);
                    skillId = data.skillId;
                }
                else
                {
                    this.contentElement.find(".gn-nodeActionSelectSkill").data("skillid", "");
                }

                return skillId;
            }

            /**
             * Saves the data
             */
            Actions.LearnForgetSkillAction.prototype.saveData = function() {
                var skillId = this.getObjectId();
                var serializeData = {
                    skillId: skillId
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));

                // Set related object data
                this.nodeModel.set("actionRelatedToObjectType", this.getObjectTypeName());
                this.nodeModel.set("actionRelatedToObjectId", skillId);
            }

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.LearnForgetSkillAction.prototype.getObjectTypeName = function() {
                return Actions.RelatedToObjectSkill;
            };

            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.LearnForgetSkillAction.prototype.getObjectId = function() {
                return this.contentElement.find(".gn-nodeActionSelectSkill").data("skillid");
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.LearnForgetSkillAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceSkill;
            };

            /**
             * Loads the skill
             * 
             * @param {string} skillId Skill Id
             * @returns {jQuery.Deferred} Deferred for the skill loading
             */
            Actions.LearnForgetSkillAction.prototype.loadObject = function(skillId) {
                var def = new jQuery.Deferred();

                var self = this;
                jQuery.ajax({ 
                    url: "/api/EvneApi/FlexFieldObject?id=" + skillId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for learning a new skill for the player
            var actionTypePlayerLearnSkill = 18;

            /**
             * Player learn a new skill Action
             * @class
             */
            Actions.PlayerLearnSkillAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.LearnForgetSkillAction.apply(this);
            };

            Actions.PlayerLearnSkillAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.LearnForgetSkillAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.PlayerLearnSkillAction.prototype.buildAction = function() {
                return new Actions.PlayerLearnSkillAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.PlayerLearnSkillAction.prototype.getType = function() {
                return actionTypePlayerLearnSkill;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.PlayerLearnSkillAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.PlayerLearnSkillLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.PlayerLearnSkillAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for forgetting a skill for the player
            var actionTypePlayerForgetSkill = 19;

            /**
             * Player forget a skill Action
             * @class
             */
            Actions.PlayerForgetSkillAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.LearnForgetSkillAction.apply(this);
            };

            Actions.PlayerForgetSkillAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.LearnForgetSkillAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.PlayerForgetSkillAction.prototype.buildAction = function() {
                return new Actions.PlayerForgetSkillAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.PlayerForgetSkillAction.prototype.getType = function() {
                return actionTypePlayerForgetSkill;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.PlayerForgetSkillAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.PlayerForgetSkillLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.PlayerForgetSkillAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for learning a skill for the npc
            var actionTypeNpcLearnSkill = 20;

            /**
             * Npc learn a skill Action
             * @class
             */
            Actions.NpcLearnSkillAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.LearnForgetSkillAction.apply(this);
            };

            Actions.NpcLearnSkillAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.LearnForgetSkillAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.NpcLearnSkillAction.prototype.buildAction = function() {
                return new Actions.NpcLearnSkillAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.NpcLearnSkillAction.prototype.getType = function() {
                return actionTypeNpcLearnSkill;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.NpcLearnSkillAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.NpcLearnsSkillLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.NpcLearnSkillAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for forgetting a skill for the npc
            var actionTypeNpcForgetSkill = 21;

            /**
             * Npc forget a skill Action
             * @class
             */
            Actions.NpcForgetSkillAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.LearnForgetSkillAction.apply(this);
            };

            Actions.NpcForgetSkillAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.LearnForgetSkillAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.NpcForgetSkillAction.prototype.buildAction = function() {
                return new Actions.NpcForgetSkillAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.NpcForgetSkillAction.prototype.getType = function() {
                return actionTypeNpcForgetSkill;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.NpcForgetSkillAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.NpcForgetSkillLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.NpcForgetSkillAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {
            
            /**
             * Change skill value Action
             * @class
             */
            Actions.ChangeSkillValueAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ChangeValueChooseObjectAction.apply(this);
            };

            Actions.ChangeSkillValueAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ChangeValueChooseObjectAction.prototype);

            /**
             * Returns the choose object label
             * 
             * @returns {string} Choose object label
             */
            Actions.ChangeSkillValueAction.prototype.getChooseLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseSkillLabel;
            };

            /**
             * Returns the open object tool label
             * 
             * @returns {string} Open object label
             */
            Actions.ChangeSkillValueAction.prototype.getOpenObjectTooltip = function() {
                return DefaultNodeShapes.Localization.Actions.OpenSkillTooltip;
            };
            
            /**
             * Opens the object
             * @param {string} id Id of the object
             */
            Actions.ChangeSkillValueAction.prototype.openObject = function(id) {
                window.open("/Evne/Skill?id=" + encodeURIComponent(id));
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.ChangeSkillValueAction.prototype.getObjectTypeName = function() {
                return Actions.RelatedToObjectSkill;
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ChangeSkillValueAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceSkill;
            };

            /**
             * Opens the search dialog
             * 
             * @returns {jQuery.Deferred} Deferred for the picking
             */
            Actions.ChangeSkillValueAction.prototype.openSearchDialog = function() {
                return GoNorth.DefaultNodeShapes.openSkillSearchDialog();
            };

            /**
             * Loads the skill
             * 
             * @returns {jQuery.Deferred} Deferred for the skill loading
             */
            Actions.ChangeSkillValueAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();

                var self = this;
                jQuery.ajax({ 
                    url: "/api/EvneApi/FlexFieldObject?id=" + this.nodeModel.get("objectId"), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for changing a player skill value
            var actionTypeChangePlayerSkillValue = 22;

            /**
             * Change skill value Action
             * @class
             */
            Actions.ChangePlayerSkillValueAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ChangeSkillValueAction.apply(this);
            };

            Actions.ChangePlayerSkillValueAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ChangeSkillValueAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ChangePlayerSkillValueAction.prototype.buildAction = function() {
                return new Actions.ChangePlayerSkillValueAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ChangePlayerSkillValueAction.prototype.getType = function() {
                return actionTypeChangePlayerSkillValue;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ChangePlayerSkillValueAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChangePlayerSkillValueLabel;
            };


            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ChangePlayerSkillValueAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for changing a npc skill value
            var actionTypeChangeNpcSkillValue = 23;

            /**
             * Change skill value Action
             * @class
             */
            Actions.ChangeNpcSkillValueAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ChangeSkillValueAction.apply(this);
            };

            Actions.ChangeNpcSkillValueAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ChangeSkillValueAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ChangeNpcSkillValueAction.prototype.buildAction = function() {
                return new Actions.ChangeNpcSkillValueAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ChangeNpcSkillValueAction.prototype.getType = function() {
                return actionTypeChangeNpcSkillValue;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ChangeNpcSkillValueAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChangeNpcSkillValueLabel;
            };


            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ChangeNpcSkillValueAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Play animation Action
             * @class
             */
            Actions.PlayAnimationAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.PlayAnimationAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.PlayAnimationAction.prototype.getContent = function() {
                return  "<input type='text' class='gn-nodeActionPlayAnimation' placeholder='" + DefaultNodeShapes.Localization.Actions.AnimationPlaceholder + "' list='gn-" + GoNorth.ProjectConfig.ConfigKeys.PlayAnimationAction + "'/>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.PlayAnimationAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                // Deserialize
                this.deserializeData();

                // Handlers
                var self = this;
                var animationName = contentElement.find(".gn-nodeActionPlayAnimation");
                animationName.change(function(e) {
                    self.saveData();
                });
            };

            /**
             * Deserializes the data
             */
            Actions.PlayAnimationAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                this.contentElement.find(".gn-nodeActionPlayAnimation").val(data.animationName);
            }

            /**
             * Saves the data
             */
            Actions.PlayAnimationAction.prototype.saveData = function() {
                var animationName = this.contentElement.find(".gn-nodeActionPlayAnimation").val();
                var serializeData = {
                    animationName: animationName
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            }

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.PlayAnimationAction.prototype.buildAction = function() {
                return new Actions.PlayAnimationAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.PlayAnimationAction.prototype.getType = function() {
                return -1;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.PlayAnimationAction.prototype.getLabel = function() {
                return "";
            };

            /**
             * Returns the config key for the action
             * 
             * @returns {string} Config key
             */
            Actions.PlayAnimationAction.prototype.getConfigKey = function() {
                return GoNorth.ProjectConfig.ConfigKeys.PlayAnimationAction;
            }

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for playing an npc animation
            var actionTypePlayNpcAnimation = 26;

            /**
             * Play npc animation action
             * @class
             */
            Actions.PlayNpcAnimationAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.PlayAnimationAction.apply(this);
            };

            Actions.PlayNpcAnimationAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.PlayAnimationAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.PlayNpcAnimationAction.prototype.buildAction = function() {
                return new Actions.PlayNpcAnimationAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.PlayNpcAnimationAction.prototype.getType = function() {
                return actionTypePlayNpcAnimation;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.PlayNpcAnimationAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.PlayNpcAnimationLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.PlayNpcAnimationAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for playing a player animation
            var actionTypePlayPlayerAnimation = 27;

            /**
             * Play player animation action
             * @class
             */
            Actions.PlayPlayerAnimationAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.PlayAnimationAction.apply(this);
            };

            Actions.PlayPlayerAnimationAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.PlayAnimationAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.PlayPlayerAnimationAction.prototype.buildAction = function() {
                return new Actions.PlayPlayerAnimationAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.PlayPlayerAnimationAction.prototype.getType = function() {
                return actionTypePlayPlayerAnimation;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.PlayPlayerAnimationAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.PlayPlayerAnimationLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.PlayPlayerAnimationAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for entering a code
            var actionTypeCode = 28;

            /**
             * Code Action
             * @class
             */
            Actions.CodeAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.CodeAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.CodeAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'><a class='gn-clickable gn-nodeActionScriptName'>" + DefaultNodeShapes.Localization.Actions.ClickHereToEditCode + "</a></div>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.CodeAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                // Deserialize
                this.deserializeData();

                // Handlers
                var self = this;
                var scriptName = contentElement.find(".gn-nodeActionScriptName");
                scriptName.click(function(e) {
                    self.openCodeEditor();
                });
            };

            /**
             * Opens the code editor
             */
            Actions.CodeAction.prototype.openCodeEditor = function() {
                var actionData = null;
                try
                {
                    actionData = JSON.parse(this.nodeModel.get("actionData"));
                }
                catch(e) 
                {
                }

                var scriptName = "";
                var scriptCode = "";
                if(actionData) 
                {
                    scriptName = actionData.scriptName;
                    scriptCode = actionData.scriptCode;
                }
                
                var self = this;
                DefaultNodeShapes.openCodeEditor(scriptName, scriptCode).then(function(codeResult) {
                    var serializeData = {
                        scriptName: codeResult.name,
                        scriptCode: codeResult.code
                    }; 
                    
                    self.nodeModel.set("actionData", JSON.stringify(serializeData));
                    self.contentElement.find(".gn-nodeActionScriptName").text(serializeData.scriptName);
                });
            };

            /**
             * Deserializes the data
             */
            Actions.CodeAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                this.contentElement.find(".gn-nodeActionScriptName").text(data.scriptName);
            }

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.CodeAction.prototype.buildAction = function() {
                return new Actions.CodeAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.CodeAction.prototype.getType = function() {
                return actionTypeCode;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.CodeAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.CodeActionLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.CodeAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Show floating text above an object action
             * @class
             */
            Actions.ShowFloatingTextAboveObjectAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
            };

            Actions.ShowFloatingTextAboveObjectAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.ShowFloatingTextAboveObjectAction.prototype.getContent = function() {
                return "<div class='gn-nodeActionText'>" + DefaultNodeShapes.Localization.Actions.FloatingText + "</div>" +
                       "<textarea class='gn-nodeActionFloatingText'></textarea>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ShowFloatingTextAboveObjectAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                // Deserialize
                this.deserializeData();

                // Handlers
                var self = this;
                var floatingText = contentElement.find(".gn-nodeActionFloatingText");
                floatingText.change(function(e) {
                    self.saveData();
                });
            };

            /**
             * Deserializes the data
             */
            Actions.ShowFloatingTextAboveObjectAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                this.contentElement.find(".gn-nodeActionFloatingText").val(data.floatingText);
            }

            /**
             * Saves the data
             */
            Actions.ShowFloatingTextAboveObjectAction.prototype.saveData = function() {
                var floatingText = this.contentElement.find(".gn-nodeActionFloatingText").val();
                var serializeData = {
                    floatingText: floatingText
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            }

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for showing a floating text above an npc
            var actionTypeShowFloatingTextAboveNpc = 29;

            /**
             * Show floating text above npc Action
             * @class
             */
            Actions.ShowFloatingTextAboveNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ShowFloatingTextAboveObjectAction.apply(this);
            };

            Actions.ShowFloatingTextAboveNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ShowFloatingTextAboveObjectAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ShowFloatingTextAboveNpcAction.prototype.buildAction = function() {
                return new Actions.ShowFloatingTextAboveNpcAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ShowFloatingTextAboveNpcAction.prototype.getType = function() {
                return actionTypeShowFloatingTextAboveNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ShowFloatingTextAboveNpcAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ShowFloatingTextAboveNpcLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ShowFloatingTextAboveNpcAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for showing a floating text above the player
            var actionTypeShowFloatingTextAbovePlayer = 30;

            /**
             * Show floating text above player Action
             * @class
             */
            Actions.ShowFloatingTextAbovePlayerAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ShowFloatingTextAboveObjectAction.apply(this);
            };

            Actions.ShowFloatingTextAbovePlayerAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ShowFloatingTextAboveObjectAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ShowFloatingTextAbovePlayerAction.prototype.buildAction = function() {
                return new Actions.ShowFloatingTextAbovePlayerAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ShowFloatingTextAbovePlayerAction.prototype.getType = function() {
                return actionTypeShowFloatingTextAbovePlayer;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ShowFloatingTextAbovePlayerAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ShowFloatingTextAbovePlayerLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ShowFloatingTextAbovePlayerAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for showing a floating text above the player
            var actionTypeShowFloatingTextAboveChooseNpc = 31;

            /**
             * Show floating text above pc action
             * @class
             */
            Actions.ShowFloatingTextAboveChooseNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.ShowFloatingTextAboveChooseNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype = jQuery.extend(Actions.ShowFloatingTextAboveChooseNpcAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.getContent = function() {
                return "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeNpcSelect gn-clickable'>" + DefaultNodeShapes.Localization.Actions.ChooseNpcLabel + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenObject' title='" + DefaultNodeShapes.Localization.Actions.OpenNpcTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" +
                       "<div class='gn-nodeActionText'>" + DefaultNodeShapes.Localization.Actions.FloatingText + "</div>" +
                       "<textarea class='gn-nodeActionFloatingText'></textarea>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                var npcOpenLink = contentElement.find(".gn-nodeActionOpenObject");

                // Deserialize
                var npcId = this.deserializeData();
                if(npcId)
                {
                    // Set related object data
                    this.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectNpc);
                    this.nodeModel.set("actionRelatedToObjectId", npcId);

                    npcOpenLink.show();

                    actionNode.showLoading();
                    actionNode.hideError();

                    this.loadObjectShared(npcId).then(function(npc) {
                        contentElement.find(".gn-actionNodeNpcSelect").text(npc.name);
                        actionNode.hideLoading();
                    }).fail(function(xhr) {
                        actionNode.hideLoading();
                        actionNode.showError();
                    });
                }

                // Handlers
                var self = this;
                var floatingText = contentElement.find(".gn-nodeActionFloatingText");
                floatingText.change(function(e) {
                    self.saveData();
                });

                var selectNpcAction = contentElement.find(".gn-actionNodeNpcSelect");
                selectNpcAction.on("click", function() {
                    GoNorth.DefaultNodeShapes.openNpcSearchDialog().then(function(npc) {
                        selectNpcAction.data("npcid", npc.id);
                        selectNpcAction.text(npc.name);
                        
                        // Set related object data
                        self.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectNpc);
                        self.nodeModel.set("actionRelatedToObjectId", npc.id);

                        npcOpenLink.show();
                    });
                });
                
                npcOpenLink.on("click", function() {
                    if(selectNpcAction.data("npcid"))
                    {
                        window.open("/Kortisto/Npc?id=" + selectNpcAction.data("npcid"));
                    }
                });
            };

            /**
             * Deserializes the data
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return "";
                }

                var data = JSON.parse(actionData);
                
                this.contentElement.find(".gn-nodeActionFloatingText").val(data.floatingText);
                var npcId = "";
                if(data.npcId)
                {
                    this.contentElement.find(".gn-actionNodeNpcSelect").data("npcid", data.npcId);
                    npcId = data.npcId;
                }
                else
                {
                    this.contentElement.find(".gn-actionNodeNpcSelect").data("npcid", "");
                }

                return npcId;
            };

            /**
             * Saves the data
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.saveData = function() {
                var floatingText = this.contentElement.find(".gn-nodeActionFloatingText").val();
                var serializeData = {
                    floatingText: floatingText,
                    npcId: this.contentElement.find(".gn-actionNodeNpcSelect").data("npcid")
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.buildAction = function() {
                return new Actions.ShowFloatingTextAboveChooseNpcAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.getType = function() {
                return actionTypeShowFloatingTextAboveChooseNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ShowFloatingTextAboveChooseNpcLabel;
            };


            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.getObjectId = function() {
                return this.contentElement.find(".gn-actionNodeNpcSelect").data("npcid");
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the npc
             * 
             * @param {string} npcId Npc Id
             * @returns {jQuery.Deferred} Deferred for the npc loading
             */
            Actions.ShowFloatingTextAboveChooseNpcAction.prototype.loadObject = function(npcId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + npcId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ShowFloatingTextAboveChooseNpcAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for setting the game time
            var actionTypeSetGameTime = 36;

            /**
             * Set game time action
             * @class
             */
            Actions.SetGameTimeAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.SetGameTimeAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.SetGameTimeAction.prototype = jQuery.extend(Actions.SetGameTimeAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.SetGameTimeAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeTimeContainer'><input type='text' class='gn-actionNodeTime' placeholder=''/></div>";
            };

            /**
             * Returns the object resource
             * 
             * @returns {string} Object Id
             */
            Actions.SetGameTimeAction.prototype.getObjectId = function() {
                return "ProjectMiscConfig";
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.SetGameTimeAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceProjectMiscConfig;
            };
            
            /**
             * Loads the project config
             * 
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Actions.SetGameTimeAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();
                
                jQuery.ajax({ 
                    url: "/api/ProjectConfigApi/GetMiscConfig", 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.SetGameTimeAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                var self = this;
                this.loadObjectShared({}).done(function(miscConfig) {
                    var actionNodeTime = self.contentElement.find(".gn-actionNodeTime");
                    GoNorth.BindingHandlers.initTimePicker(actionNodeTime, function(timeValue) {
                        self.serialize(timeValue.hours, timeValue.minutes);
                    }, miscConfig.hoursPerDay, miscConfig.minutesPerHour, DefaultNodeShapes.Localization.Actions.TimeFormat, function() {
                        contentElement.closest(".node").addClass("gn-actionNodeTimeOverflow");
                    }, function() {
                        contentElement.closest(".node").removeClass("gn-actionNodeTimeOverflow");
                    }, true);

                    GoNorth.BindingHandlers.setTimePickerValue(actionNodeTime, 0, 0, miscConfig.hoursPerDay, miscConfig.minutesPerHour);
                    
                    self.deserialize(actionNodeTime, miscConfig);
                });

            };

            /**
             * Deserializes the data
             * 
             * @param {object} actionNodeTime HTML Element for the time picker
             * @param {object} miscConfig Misc config
             */
            Actions.SetGameTimeAction.prototype.deserialize = function(actionNodeTime, miscConfig) {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return;
                }

                var data = JSON.parse(actionData);

                GoNorth.BindingHandlers.setTimePickerValue(actionNodeTime, data.hours, data.minutes, miscConfig.hoursPerDay, miscConfig.minutesPerHour);
            };

            /**
             * Saves the data
             * 
             * @param {number} hours Hours
             * @param {number} minutes Minutes
             */
            Actions.SetGameTimeAction.prototype.serialize = function(hours, minutes) {
                var serializeData = {
                    hours: hours,
                    minutes: minutes
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SetGameTimeAction.prototype.buildAction = function() {
                return new Actions.SetGameTimeAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SetGameTimeAction.prototype.getType = function() {
                return actionTypeSetGameTime;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SetGameTimeAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SetGameTimeActionLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SetGameTimeAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Set Daily Routine event state action
             * @class
             */
            Actions.SetDailyRoutineEventStateAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.SetDailyRoutineEventStateAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.SetDailyRoutineEventStateAction.prototype = jQuery.extend(Actions.SetDailyRoutineEventStateAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.SetDailyRoutineEventStateAction.prototype.getContent = function() {
                return  "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeObjectSelect gn-clickable'>" + DefaultNodeShapes.Localization.Actions.ChooseDailyRoutineEvent + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenObject' title='" + DefaultNodeShapes.Localization.Actions.OpenDailyRoutineEventNpcTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.SetDailyRoutineEventStateAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;
                
                var openObjectLink = contentElement.find(".gn-nodeActionOpenObject");

                // Deserialize
                var deserializedData = this.deserializeData();
                if(deserializedData)
                {
                    this.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectNpc);
                    this.nodeModel.set("actionRelatedToObjectId", deserializedData.npcId);
                    this.nodeModel.set("actionRelatedToAdditionalObjects", [{
                        objectType: Actions.RelatedToObjectDailyRoutine,
                        objectId: deserializedData.eventId
                    }]);

                    this.loadEventFromNpc(deserializedData.npcId, deserializedData.eventId);
                }

                // Handlers
                var self = this;
                contentElement.find(".gn-actionNodeObjectSelect").on("click", function() {
                    GoNorth.DefaultNodeShapes.openDailyRoutineEventSearchDialog().then(function(dailyRoutine) {
                        self.nodeModel.set("objectId", dailyRoutine.parentObject.id);
                        self.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectNpc);
                        self.nodeModel.set("actionRelatedToObjectId", dailyRoutine.parentObject.id);
                        self.nodeModel.set("actionRelatedToAdditionalObjects", [{
                            objectType: Actions.RelatedToObjectDailyRoutine,
                            objectId: dailyRoutine.eventId
                        }]);

                        self.saveData(dailyRoutine.parentObject.id, dailyRoutine.eventId);

                        contentElement.find(".gn-actionNodeObjectSelect").text(dailyRoutine.parentObject.name + ": " + dailyRoutine.name);

                        openObjectLink.show();
                    });
                });
                
                openObjectLink.on("click", function() {
                    var npcId = self.nodeModel.get("objectId");
                    if(npcId) 
                    {
                        window.open("/Kortisto/Npc?id=" + npcId);
                    }
                });
            };

            /**
             * Deserializes the data
             * @returns {object} Deserialized data
             */
            Actions.SetDailyRoutineEventStateAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return null;
                }

                var data = JSON.parse(actionData);
                this.nodeModel.set("objectId", data.npcId);

                return data;
            };

            /**
             * Loads the event from an npc
             * @param {string} npcId Id of the npc
             * @param {string} eventId Id of the event
             */
            Actions.SetDailyRoutineEventStateAction.prototype.loadEventFromNpc = function(npcId, eventId) {
                var self = this;
                this.loadObjectShared(npcId).then(function(npc) {
                    if(!npc.dailyRoutine) 
                    {
                        return;
                    }

                    for(var curEvent = 0; curEvent < npc.dailyRoutine.length; ++curEvent)
                    {
                        if(npc.dailyRoutine[curEvent].eventId == eventId)
                        {
                            var eventName = GoNorth.DailyRoutines.Util.formatTimeSpan(DefaultNodeShapes.Localization.Actions.TimeFormat, npc.dailyRoutine[curEvent].earliestTime, npc.dailyRoutine[curEvent].latestTime);
                            self.contentElement.find(".gn-actionNodeObjectSelect").text(npc.name + ": " + eventName);
                            self.contentElement.find(".gn-nodeActionOpenObject").show();
                            break;
                        }
                    }
                });
            };

            /**
             * Saves the data
             * @param {string} npcId Id of the npc
             * @param {string} eventId Id of the event
             */
            Actions.SetDailyRoutineEventStateAction.prototype.saveData = function(npcId, eventId) {
                var serializeData = {
                    npcId: npcId,
                    eventId: eventId
                };
                
                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            /**
             * Returns the names of the custom action attributes
             * 
             * @returns {string[]} Name of the custom action attributes
             */
            Actions.SetDailyRoutineEventStateAction.prototype.getCustomActionAttributes = function() {
                return [ "objectId" ];
            };


            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.SetDailyRoutineEventStateAction.prototype.getObjectId = function() {
                return this.nodeModel.get("objectId");
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.SetDailyRoutineEventStateAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the npc
             * 
             * @returns {jQuery.Deferred} Deferred for the npc loading
             */
            Actions.SetDailyRoutineEventStateAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + this.nodeModel.get("objectId"), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SetDailyRoutineEventStateAction.prototype.buildAction = function() {
                return new Actions.SetDailyRoutineEventStateAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SetDailyRoutineEventStateAction.prototype.getType = function() {
                return -1;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SetDailyRoutineEventStateAction.prototype.getLabel = function() {
                return "";
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for disabling a daily routine event
            var actionTypeDisableDailyRoutineEvent = 37;

            /**
             * Disable daily routine event action
             * @class
             */
            Actions.DisableDailyRoutineEventAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.SetDailyRoutineEventStateAction.apply(this);
            };

            Actions.DisableDailyRoutineEventAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.SetDailyRoutineEventStateAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.DisableDailyRoutineEventAction.prototype.buildAction = function() {
                return new Actions.DisableDailyRoutineEventAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.DisableDailyRoutineEventAction.prototype.getType = function() {
                return actionTypeDisableDailyRoutineEvent;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.DisableDailyRoutineEventAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.DisableDailyRoutineEventLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.DisableDailyRoutineEventAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for enabling a daily routine event
            var actionTypeEnableDailyRoutineEvent = 38;

            /**
             * Enable daily routine event action
             * @class
             */
            Actions.EnableDailyRoutineEventAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.SetDailyRoutineEventStateAction.apply(this);
            };

            Actions.EnableDailyRoutineEventAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.SetDailyRoutineEventStateAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.EnableDailyRoutineEventAction.prototype.buildAction = function() {
                return new Actions.EnableDailyRoutineEventAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.EnableDailyRoutineEventAction.prototype.getType = function() {
                return actionTypeEnableDailyRoutineEvent;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.EnableDailyRoutineEventAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.EnableDailyRoutineEventLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.EnableDailyRoutineEventAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Move object action
             * @class
             */
            Actions.MoveObjectAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.MoveObjectAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.MoveObjectAction.prototype = jQuery.extend(Actions.MoveObjectAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns true if the action has a movement state, else false
             * 
             * @returns {bool} true if the action has a movement state, else false
             */
            Actions.MoveObjectAction.prototype.hasMovementState = function() {
                return false;
            };

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.MoveObjectAction.prototype.getContent = function() {
                var templateHtml = "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeMarkerSelect gn-clickable'>" + DefaultNodeShapes.Localization.Actions.ChooseMarkerLabel + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenObject' title='" + DefaultNodeShapes.Localization.Actions.OpenMarkerTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>";
                
                if(this.hasMovementState())
                {
                    templateHtml += "<input type='text' class='gn-nodeActionMovementState' placeholder='" + DefaultNodeShapes.Localization.Actions.MovementStatePlaceholder + "' list='gn-" + GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction + "'/>";
                }

                return templateHtml;
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.MoveObjectAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                var markerOpenLink = contentElement.find(".gn-nodeActionOpenObject");

                // Deserialize
                var deserializedData = this.deserializeData();
                if(deserializedData) {
                    this.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectMapMarker);
                    this.nodeModel.set("actionRelatedToObjectId", deserializedData.markerId);
                    this.nodeModel.set("actionRelatedToAdditionalObjects", [{
                        objectType: Actions.RelatedToObjectMap,
                        objectId: deserializedData.mapId
                    }]);

                    this.loadMarkerFromMap(deserializedData.mapId, deserializedData.markerId);
                }

                // Handlers
                var self = this;
                var selectMarkerAction = contentElement.find(".gn-actionNodeMarkerSelect");
                selectMarkerAction.on("click", function() {
                    GoNorth.DefaultNodeShapes.openMarkerSearchDialog().then(function(marker) {
                        selectMarkerAction.data("mapid", marker.mapId);
                        selectMarkerAction.data("markerid", marker.id);
                        selectMarkerAction.data("markertype", marker.markerType);
                        selectMarkerAction.text(marker.name);
                        
                        // Set related object data
                        self.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectMapMarker);
                        self.nodeModel.set("actionRelatedToObjectId", marker.id);
                        self.nodeModel.set("actionRelatedToAdditionalObjects", [{
                            objectType: Actions.RelatedToObjectMap,
                            objectId: marker.mapId
                        }]);

                        self.saveData(marker.mapId, marker.id, marker.markerType)

                        markerOpenLink.show();
                    });
                });
                 
                markerOpenLink.on("click", function() {
                    if(selectMarkerAction.data("markerid"))
                    {
                        window.open("/Karta?id=" + selectMarkerAction.data("mapid") + "&zoomOnMarkerId=" + selectMarkerAction.data("markerid") + "&zoomOnMarkerType=" + selectMarkerAction.data("markertype"))
                    }
                });

                var movementState = contentElement.find(".gn-nodeActionMovementState");
                movementState.change(function(e) {
                    self.saveData();
                });
            };

            /**
             * Deserializes the data
             */
            Actions.MoveObjectAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return null;
                }

                var data = JSON.parse(actionData);
                
                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");
                selectMarkerAction.data("mapid", data.mapId);
                selectMarkerAction.data("markerid", data.markerId);
                selectMarkerAction.data("markertype", data.markerType);
                
                this.contentElement.find(".gn-nodeActionMovementState").val(data.movementState);

                return data;
            };

            /**
             * Loads the marker from a map
             * @param {string} mapId Id of the map
             * @param {string} markerId Id of the marker
             */
            Actions.MoveObjectAction.prototype.loadMarkerFromMap = function(mapId, markerId) {
                var self = this;
                this.loadObjectShared({ mapId: mapId, markerId: markerId }).then(function(marker) {
                    if(!marker) 
                    {
                        return;
                    }

                    self.contentElement.find(".gn-actionNodeMarkerSelect").text(marker.markerName + " (" + marker.mapName + ")");
                    self.contentElement.find(".gn-nodeActionOpenObject").show();
                });
            };

            /**
             * Saves the data
             */
            Actions.MoveObjectAction.prototype.saveData = function() {
                var movementState = this.contentElement.find(".gn-nodeActionMovementState").val();
                if(!movementState)
                {
                    movementState = "";
                }

                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");

                var serializeData = {
                    mapId: selectMarkerAction.data("mapid"),
                    markerId: selectMarkerAction.data("markerid"),
                    markerType: selectMarkerAction.data("markertype"),
                    movementState: movementState
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            
            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.MoveObjectAction.prototype.getObjectId = function(existingData) {
                return existingData.mapId + "|" + existingData.markerId;
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.MoveObjectAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceMapMarker;
            };

            /**
             * Loads the marker
             * 
             * @returns {jQuery.Deferred} Deferred for the marker loading
             */
            Actions.MoveObjectAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();

                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");

                jQuery.ajax({ 
                    url: "/api/KartaApi/GetMarker?mapId=" + selectMarkerAction.data("mapid") + "&markerId=" + selectMarkerAction.data("markerid"), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            /**
             * Returns the config key for the action
             * 
             * @returns {string} Config key
             */
            Actions.MoveObjectAction.prototype.getConfigKey = function() {
                if(this.hasMovementState())
                {
                    return GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction;
                }

                return null;
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for teleporting an npc
            var actionTypeTeleportNpc = 39;

            /**
             * Teleport npc Action
             * @class
             */
            Actions.TeleportNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveObjectAction.apply(this);
            };

            Actions.TeleportNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveObjectAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.TeleportNpcAction.prototype.buildAction = function() {
                return new Actions.TeleportNpcAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.TeleportNpcAction.prototype.getType = function() {
                return actionTypeTeleportNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.TeleportNpcAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TeleportNpcLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.TeleportNpcAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for teleporting the player
            var actionTypeTeleportPlayer = 40;

            /**
             * Teleport player Action
             * @class
             */
            Actions.TeleportPlayerAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveObjectAction.apply(this);
            };

            Actions.TeleportPlayerAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveObjectAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.TeleportPlayerAction.prototype.buildAction = function() {
                return new Actions.TeleportPlayerAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.TeleportPlayerAction.prototype.getType = function() {
                return actionTypeTeleportPlayer;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.TeleportPlayerAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TeleportPlayerLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.TeleportPlayerAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Indicating am object must be loaded
            var loadTypeObject = 0;

            /// Indicating a marker must be loaded
            var loadTypeMarker = 1;

            /**
             * Move choose object action
             * @class
             */
            Actions.MoveChooseObjectAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.MoveChooseObjectAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.MoveChooseObjectAction.prototype = jQuery.extend(Actions.MoveChooseObjectAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns true if the action has a movement state, else false
             * 
             * @returns {bool} true if the action has a movement state, else false
             */
            Actions.MoveChooseObjectAction.prototype.hasMovementState = function() {
                return false;
            };

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.MoveChooseObjectAction.prototype.getContent = function() {
                var templateHtml = "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeObjectSelect gn-clickable'>" + this.getChooseObjectLabel() + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenChooseObject' title='" + this.getOpenObjectTooltip() + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" + 
                        "<div class='gn-actionNodeObjectSelectionSeperator'>" + this.getSelectionSeperatorLabel() + "</div>" +
                        "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeMarkerSelect gn-clickable'>" + DefaultNodeShapes.Localization.Actions.ChooseMarkerLabel + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenObject' title='" + DefaultNodeShapes.Localization.Actions.OpenMarkerTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>";

                if(this.hasMovementState())
                {
                    templateHtml += "<input type='text' class='gn-nodeActionMovementState' placeholder='" + DefaultNodeShapes.Localization.Actions.MovementStatePlaceholder + "' list='gn-" + GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction + "'/>";
                }

                return templateHtml;
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.MoveChooseObjectAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                var objectOpenLink = contentElement.find(".gn-nodeActionOpenChooseObject");
                var markerOpenLink = contentElement.find(".gn-nodeActionOpenObject");

                // Deserialize
                var deserializedData = this.deserializeData();
                if(deserializedData) {
                    this.loadObjectFromDeserialize(deserializedData.objectId);
                    this.loadMarkerFromMap(deserializedData.mapId, deserializedData.markerId);
                }

                // Handlers
                var self = this;
                var selectObjectAction = contentElement.find(".gn-actionNodeObjectSelect");
                selectObjectAction.on("click", function() {
                    self.openChooseObjectDialog().then(function(object) {
                        selectObjectAction.data("selectedobjectid", object.id);
                        selectObjectAction.text(object.name);
                        
                        self.saveData();

                        objectOpenLink.show();
                    });
                });

                objectOpenLink.on("click", function() {
                    if(selectObjectAction.data("selectedobjectid"))
                    {
                        self.openObject(selectObjectAction.data("selectedobjectid"))
                    }
                });


                var selectMarkerAction = contentElement.find(".gn-actionNodeMarkerSelect");
                selectMarkerAction.on("click", function() {
                    GoNorth.DefaultNodeShapes.openMarkerSearchDialog().then(function(marker) {
                        selectMarkerAction.data("mapid", marker.mapId);
                        selectMarkerAction.data("markerid", marker.id);
                        selectMarkerAction.data("markertype", marker.markerType);
                        selectMarkerAction.text(marker.name);
                        
                        self.saveData();

                        markerOpenLink.show();
                    });
                });
                 
                markerOpenLink.on("click", function() {
                    if(selectMarkerAction.data("markerid"))
                    {
                        window.open("/Karta?id=" + selectMarkerAction.data("mapid") + "&zoomOnMarkerId=" + selectMarkerAction.data("markerid") + "&zoomOnMarkerType=" + selectMarkerAction.data("markertype"))
                    }
                });
                
                var movementState = contentElement.find(".gn-nodeActionMovementState");
                movementState.change(function(e) {
                    self.saveData();
                });
            };

            /**
             * Deserializes the data
             */
            Actions.MoveChooseObjectAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return null;
                }

                var data = JSON.parse(actionData);

                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                selectObjectAction.data("selectedobjectid", data.objectId);

                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");
                selectMarkerAction.data("mapid", data.mapId);
                selectMarkerAction.data("markerid", data.markerId);
                selectMarkerAction.data("markertype", data.markerType);

                this.contentElement.find(".gn-nodeActionMovementState").val(data.movementState);

                this.setRelatedToData();

                return data;
            };

            /**
             * Loads the marker from a map
             * @param {string} mapId Id of the map
             * @param {string} markerId Id of the marker
             */
            Actions.MoveChooseObjectAction.prototype.loadObjectFromDeserialize = function(objectId) {
                if(!objectId) {
                    return;
                }

                var self = this;
                this.loadObjectShared({ loadType: loadTypeObject, objectId: objectId }).then(function(loadedObject) {
                    if(!loadedObject) 
                    {
                        return;
                    }

                    self.contentElement.find(".gn-actionNodeObjectSelect").text(loadedObject.name);
                    self.contentElement.find(".gn-nodeActionOpenChooseObject").show();
                });
            };

            /**
             * Loads the marker from a map
             * @param {string} mapId Id of the map
             * @param {string} markerId Id of the marker
             */
            Actions.MoveChooseObjectAction.prototype.loadMarkerFromMap = function(mapId, markerId) {
                if(!mapId || !markerId) {
                    return;
                }

                var self = this;
                this.loadObjectShared({ loadType: loadTypeMarker, mapId: mapId, markerId: markerId }).then(function(marker) {
                    if(!marker) 
                    {
                        return;
                    }

                    self.contentElement.find(".gn-actionNodeMarkerSelect").text(marker.markerName + " (" + marker.mapName + ")");
                    self.contentElement.find(".gn-nodeActionOpenObject").show();
                });
            };

            /**
             * Sets the related to data
             */
            Actions.MoveChooseObjectAction.prototype.setRelatedToData = function() {
                var additionalRelatedObjects = [];
                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                if(selectObjectAction.data("selectedobjectid"))
                {
                    this.nodeModel.set("actionRelatedToObjectType", this.getRelatedToObjectType());
                    this.nodeModel.set("actionRelatedToObjectId", selectObjectAction.data("selectedobjectid"));
                    
                }

                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");
                if(selectMarkerAction.data("markerid"))
                {
                    additionalRelatedObjects.push({
                        objectType: Actions.RelatedToObjectMapMarker,
                        objectId: selectMarkerAction.data("markerid")
                    });
                }

                if(selectMarkerAction.data("mapid"))
                {
                    additionalRelatedObjects.push({
                        objectType: Actions.RelatedToObjectMap,
                        objectId: selectMarkerAction.data("mapid")
                    });
                }
                this.nodeModel.set("actionRelatedToAdditionalObjects", additionalRelatedObjects);
            }

            /**
             * Saves the data
             */
            Actions.MoveChooseObjectAction.prototype.saveData = function() {
                this.setRelatedToData();
                
                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");

                var movementState = this.contentElement.find(".gn-nodeActionMovementState").val();
                if(!movementState)
                {
                    movementState = "";
                }

                var serializeData = {
                    objectId: selectObjectAction.data("selectedobjectid"),
                    mapId: selectMarkerAction.data("mapid"),
                    markerId: selectMarkerAction.data("markerid"),
                    markerType: selectMarkerAction.data("markertype"),
                    movementState: movementState
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            
            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.MoveChooseObjectAction.prototype.getObjectId = function(existingData) {
                if(existingData.loadType == loadTypeMarker)
                {
                    return existingData.mapId + "|" + existingData.markerId;
                }

                return existingData.objectId;
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.MoveChooseObjectAction.prototype.getObjectResource = function(existingData) {
                if(existingData.loadType == loadTypeMarker)
                {
                    return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceMapMarker;
                }

                return this.getObjectResourceType();
            };

            /**
             * Loads the marker or npc
             * 
             * @param {string} objectId Extracted object id
             * @param {string} existingData Existing data
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.MoveChooseObjectAction.prototype.loadObject = function(objectId, existingData) {
                if(existingData.loadType == loadTypeMarker)
                {
                    var def = new jQuery.Deferred();

                    var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");
                    jQuery.ajax({ 
                        url: "/api/KartaApi/GetMarker?mapId=" + selectMarkerAction.data("mapid") + "&markerId=" + selectMarkerAction.data("markerid"), 
                        type: "GET"
                    }).done(function(data) {
                        def.resolve(data);
                    }).fail(function(xhr) {
                        def.reject();
                    });

                    return def.promise();
                }

                return this.loadChoosenObject(existingData.objectId);
            };
            
            /**
             * Returns the config key for the action
             * 
             * @returns {string} Config key
             */
            Actions.MoveChooseObjectAction.prototype.getConfigKey = function() {
                if(this.hasMovementState())
                {
                    return GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction;
                }

                return null;
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for teleporting an npc which is choosen
            var actionTypeTeleportChoseNpc = 41;

            /**
             * Teleport choose npc Action
             * @class
             */
            Actions.TeleportChooseNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveChooseObjectAction.apply(this);
            };

            Actions.TeleportChooseNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveChooseObjectAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.TeleportChooseNpcAction.prototype.buildAction = function() {
                return new Actions.TeleportChooseNpcAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.TeleportChooseNpcAction.prototype.getType = function() {
                return actionTypeTeleportChoseNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.TeleportChooseNpcAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TeleportChooseNpcLabel;
            };
        

            /**
             * Opens the choose object dialog
             * 
             * @returns {jQuery.Deferred} Deferred that will be resolved with the choosen object
             */
            Actions.TeleportChooseNpcAction.prototype.openChooseObjectDialog = function() {
                return GoNorth.DefaultNodeShapes.openNpcSearchDialog();
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.TeleportChooseNpcAction.prototype.getChooseObjectLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseNpcLabel;
            };

            /**
             * Returns the selections seperator label
             * 
             * @returns {string} Label for seperation
             */
            Actions.TeleportChooseNpcAction.prototype.getSelectionSeperatorLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TeleportTo;
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.TeleportChooseNpcAction.prototype.getOpenObjectTooltip = function() {
                return DefaultNodeShapes.Localization.Actions.OpenNpcTooltip;
            };

            /**
             * Opens the object
             * 
             * @param {string} id Id of the object
             */
            Actions.TeleportChooseNpcAction.prototype.openObject = function(id) {
                window.open("/Kortisto/Npc?id=" + id)
            }

            /**
             * Returns the related object type of the choosen object
             * 
             * @returns {string} Related object type of the choosen object
             */
            Actions.TeleportChooseNpcAction.prototype.getRelatedToObjectType = function() {
                return Actions.RelatedToObjectNpc;
            };

            /**
             * Returns the loading object resource type
             * 
             * @returns {number} Loading objcet resource type
             */
            Actions.TeleportChooseNpcAction.prototype.getObjectResourceType = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the choosen object
             * 
             * @returns {number} Loading objcet resource type
             * @param {string} npcId Npc Id
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.TeleportChooseNpcAction.prototype.loadChoosenObject = function(npcId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + npcId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.TeleportChooseNpcAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for walking an npc to a target marker
            var actionTypeWalkNpcToMarker = 42;

            /**
             * Walk npc to marker Action
             * @class
             */
            Actions.WalkNpcToMarkerAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveObjectAction.apply(this);
            };

            Actions.WalkNpcToMarkerAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveObjectAction.prototype);

            /**
             * Returns true if the action has a movement state, else false
             * 
             * @returns {bool} true if the action has a movement state, else false
             */
            Actions.WalkNpcToMarkerAction.prototype.hasMovementState = function() {
                return true;
            };

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.WalkNpcToMarkerAction.prototype.buildAction = function() {
                return new Actions.WalkNpcToMarkerAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.WalkNpcToMarkerAction.prototype.getType = function() {
                return actionTypeWalkNpcToMarker;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.WalkNpcToMarkerAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkNpcLabel;
            };
                
            /**
             * Returns the label for the main output
             * 
             * @returns {string} Label for the main output
             */
            Actions.WalkNpcToMarkerAction.prototype.getMainOutputLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkOnTargetReachLabel;
            };

            /**
             * Returns the additional outports of the action
             * 
             * @returns {string[]} Additional outports
             */
            Actions.WalkNpcToMarkerAction.prototype.getAdditionalOutports = function() {
                return [ DefaultNodeShapes.Localization.Actions.WalkDirectContinueLabel ];
            };


            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.WalkNpcToMarkerAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for walking an npc which is choosen
            var actionTypeWalkChoseNpc = 43;

            /**
             * Walk choose npc to marker Action
             * @class
             */
            Actions.WalkChooseNpcToMarkerAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveChooseObjectAction.apply(this);
            };

            Actions.WalkChooseNpcToMarkerAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveChooseObjectAction.prototype);

            /**
             * Returns true if the action has a movement state, else false
             * 
             * @returns {bool} true if the action has a movement state, else false
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.hasMovementState = function() {
                return true;
            };

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.buildAction = function() {
                return new Actions.WalkChooseNpcToMarkerAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getType = function() {
                return actionTypeWalkChoseNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkChooseNpcLabel;
            };
        
            /**
             * Returns the label for the main output
             * 
             * @returns {string} Label for the main output
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getMainOutputLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkOnTargetReachLabel;
            };

            /**
             * Returns the additional outports of the action
             * 
             * @returns {string[]} Additional outports
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getAdditionalOutports = function() {
                return [ DefaultNodeShapes.Localization.Actions.WalkDirectContinueLabel ];
            };


            /**
             * Opens the choose object dialog
             * 
             * @returns {jQuery.Deferred} Deferred that will be resolved with the choosen object
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.openChooseObjectDialog = function() {
                return GoNorth.DefaultNodeShapes.openNpcSearchDialog();
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getChooseObjectLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseNpcLabel;
            };

            /**
             * Returns the selections seperator label
             * 
             * @returns {string} Label for seperation
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getSelectionSeperatorLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkTo;
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getOpenObjectTooltip = function() {
                return DefaultNodeShapes.Localization.Actions.OpenNpcTooltip;
            };

            /**
             * Opens the object
             * 
             * @param {string} id Id of the object
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.openObject = function(id) {
                window.open("/Kortisto/Npc?id=" + id)
            }

            /**
             * Returns the related object type of the choosen object
             * 
             * @returns {string} Related object type of the choosen object
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getRelatedToObjectType = function() {
                return Actions.RelatedToObjectNpc;
            };

            /**
             * Returns the loading object resource type
             * 
             * @returns {number} Loading objcet resource type
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.getObjectResourceType = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the choosen object
             * 
             * @returns {number} Loading objcet resource type
             * @param {string} npcId Npc Id
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.WalkChooseNpcToMarkerAction.prototype.loadChoosenObject = function(npcId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + npcId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.WalkChooseNpcToMarkerAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /**
             * Move object action
             * @class
             */
            Actions.MoveObjectToNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.MoveObjectToNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.MoveObjectToNpcAction.prototype = jQuery.extend(Actions.MoveObjectToNpcAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns true if the action has a movement state, else false
             * 
             * @returns {bool} true if the action has a movement state, else false
             */
            Actions.MoveObjectToNpcAction.prototype.hasMovementState = function() {
                return false;
            };

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.MoveObjectToNpcAction.prototype.getContent = function() {
                var templateHtml = "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeNpcSelect gn-clickable'>" + DefaultNodeShapes.Localization.Actions.ChooseNpcLabel + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenObject' title='" + DefaultNodeShapes.Localization.Actions.OpenNpcTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>";

                if(this.hasMovementState())
                {
                    templateHtml += "<input type='text' class='gn-nodeActionMovementState' placeholder='" + DefaultNodeShapes.Localization.Actions.MovementStatePlaceholder + "' list='gn-" + GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction + "'/>";
                }
        
                return templateHtml;
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.MoveObjectToNpcAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                var npcOpenLink = contentElement.find(".gn-nodeActionOpenObject");

                // Deserialize
                var deserializedData = this.deserializeData();
                if(deserializedData && deserializedData.npcId) {
                    this.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectNpc);
                    this.nodeModel.set("actionRelatedToObjectId", deserializedData.npcId);

                    this.loadNpc(deserializedData);
                }

                // Handlers
                var self = this;
                var selectNpcAction = contentElement.find(".gn-actionNodeNpcSelect");
                selectNpcAction.on("click", function() {
                    GoNorth.DefaultNodeShapes.openNpcSearchDialog().then(function(npc) {
                        selectNpcAction.data("npcid", npc.id);
                        selectNpcAction.text(npc.name);
                        
                        // Set related object data
                        self.nodeModel.set("actionRelatedToObjectType", Actions.RelatedToObjectNpc);
                        self.nodeModel.set("actionRelatedToObjectId", npc.id);

                        self.saveData(npc.id)

                        npcOpenLink.show();
                    });
                });
                 
                npcOpenLink.on("click", function() {
                    if(selectNpcAction.data("npcid"))
                    {
                        window.open("/Kortisto/Npc?id=" + selectNpcAction.data("npcid"))
                    }
                });

                var movementState = contentElement.find(".gn-nodeActionMovementState");
                movementState.change(function(e) {
                    self.saveData();
                });
            };

            /**
             * Deserializes the data
             */
            Actions.MoveObjectToNpcAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return null;
                }

                var data = JSON.parse(actionData);
                
                var selectNpcAction = this.contentElement.find(".gn-actionNodeNpcSelect");
                selectNpcAction.data("npcid", data.npcId);

                this.contentElement.find(".gn-nodeActionMovementState").val(data.movementState);

                return data;
            };

            /**
             * Loads the npc
             * @param {string} npcId Id of the npc
             */
            Actions.MoveObjectToNpcAction.prototype.loadNpc = function(npcData) {
                var self = this;
                this.loadObjectShared(npcData).then(function(npc) {
                    if(!npc) 
                    {
                        return;
                    }

                    self.contentElement.find(".gn-actionNodeNpcSelect").text(npc.name);
                    self.contentElement.find(".gn-nodeActionOpenObject").show();
                });
            };

            /**
             * Saves the data
             * @param {string} npcId Npc id
             */
            Actions.MoveObjectToNpcAction.prototype.saveData = function(npcId) {
                var movementState = this.contentElement.find(".gn-nodeActionMovementState").val();
                if(!movementState)
                {
                    movementState = "";
                }

                var serializeData = {
                    npcId: npcId,
                    movementState: movementState
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            
            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.MoveObjectToNpcAction.prototype.getObjectId = function(existingData) {
                return existingData.npcId;
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.MoveObjectToNpcAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the npcs
             * 
             * @returns {jQuery.Deferred} Deferred for the npc loading
             */
            Actions.MoveObjectToNpcAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();

                var selectNpcAction = this.contentElement.find(".gn-actionNodeNpcSelect");

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + selectNpcAction.data("npcid"), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            /**
             * Returns the config key for the action
             * 
             * @returns {string} Config key
             */
            Actions.MoveObjectToNpcAction.prototype.getConfigKey = function() {
                if(this.hasMovementState())
                {
                    return GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction;
                }

                return null;
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for teleporting an npc to an npc
            var actionTypeTeleportNpcToNpc = 44;

            /**
             * Teleport npc to npc Action
             * @class
             */
            Actions.TeleportNpcToNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveObjectToNpcAction.apply(this);
            };

            Actions.TeleportNpcToNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveObjectToNpcAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.TeleportNpcToNpcAction.prototype.buildAction = function() {
                return new Actions.TeleportNpcToNpcAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.TeleportNpcToNpcAction.prototype.getType = function() {
                return actionTypeTeleportNpcToNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.TeleportNpcToNpcAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TeleportNpcToNpcLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.TeleportNpcToNpcAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Indicating am object must be loaded
            var loadTypeObject = 0;

            /// Indicating a npc must be loaded
            var loadTypeNpc = 1;

            /**
             * Move choose object to npcaction
             * @class
             */
            Actions.MoveChooseObjectToNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.MoveChooseObjectToNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.MoveChooseObjectToNpcAction.prototype = jQuery.extend(Actions.MoveChooseObjectToNpcAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns true if the action has a movement state, else false
             * 
             * @returns {bool} true if the action has a movement state, else false
             */
            Actions.MoveChooseObjectToNpcAction.prototype.hasMovementState = function() {
                return false;
            };

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.MoveChooseObjectToNpcAction.prototype.getContent = function() {
                var templateHtml = "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeObjectSelect gn-clickable'>" + this.getChooseObjectLabel() + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenChooseObject' title='" + this.getOpenObjectTooltip() + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" + 
                        "<div class='gn-actionNodeObjectSelectionSeperator'>" + this.getSelectionSeperatorLabel() + "</div>" +
                        "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeNpcSelect gn-clickable'>" + DefaultNodeShapes.Localization.Actions.ChooseNpcLabel + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenObject' title='" + DefaultNodeShapes.Localization.Actions.OpenNpcTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>";
                
                if(this.hasMovementState())
                {
                    templateHtml += "<input type='text' class='gn-nodeActionMovementState' placeholder='" + DefaultNodeShapes.Localization.Actions.MovementStatePlaceholder + "' list='gn-" + GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction + "'/>";
                }

                return templateHtml;
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.MoveChooseObjectToNpcAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                var objectOpenLink = contentElement.find(".gn-nodeActionOpenChooseObject");
                var npcOpenLink = contentElement.find(".gn-nodeActionOpenObject");

                // Deserialize
                var deserializedData = this.deserializeData();
                if(deserializedData) {
                    this.loadObjectFromDeserialize(deserializedData.objectId);
                    this.loadNpc(deserializedData.npcId);
                }

                // Handlers
                var self = this;
                var selectObjectAction = contentElement.find(".gn-actionNodeObjectSelect");
                selectObjectAction.on("click", function() {
                    self.openChooseObjectDialog().then(function(object) {
                        selectObjectAction.data("selectedobjectid", object.id);
                        selectObjectAction.text(object.name);
                        
                        self.saveData();

                        objectOpenLink.show();
                    });
                });

                objectOpenLink.on("click", function() {
                    if(selectObjectAction.data("selectedobjectid"))
                    {
                        self.openObject(selectObjectAction.data("selectedobjectid"))
                    }
                });


                var selectNpcAction = contentElement.find(".gn-actionNodeNpcSelect");
                selectNpcAction.on("click", function() {
                    GoNorth.DefaultNodeShapes.openNpcSearchDialog().then(function(npc) {
                        selectNpcAction.data("npcid", npc.id);
                        selectNpcAction.text(npc.name);
                        
                        self.saveData();

                        npcOpenLink.show();
                    });
                });
                 
                npcOpenLink.on("click", function() {
                    if(selectNpcAction.data("npcid"))
                    {
                        window.open("/Kortisto/Npc?id=" + selectNpcAction.data("npcid"))
                    }
                });

                var movementState = contentElement.find(".gn-nodeActionMovementState");
                movementState.change(function(e) {
                    self.saveData();
                });
            };

            /**
             * Deserializes the data
             */
            Actions.MoveChooseObjectToNpcAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return null;
                }

                var data = JSON.parse(actionData);

                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                selectObjectAction.data("selectedobjectid", data.objectId);

                var selectNpcAction = this.contentElement.find(".gn-actionNodeNpcSelect");
                selectNpcAction.data("npcid", data.npcId);
                
                this.contentElement.find(".gn-nodeActionMovementState").val(data.movementState);

                this.setRelatedToData();

                return data;
            };

            /**
             * Loads the npc
             * @param {string} objectId Id of the npc
             */
            Actions.MoveChooseObjectToNpcAction.prototype.loadObjectFromDeserialize = function(objectId) {
                if(!objectId) {
                    return;
                }

                var self = this;
                this.loadObjectShared({ loadType: loadTypeObject, objectId: objectId }).then(function(loadedObject) {
                    if(!loadedObject) 
                    {
                        return;
                    }

                    self.contentElement.find(".gn-actionNodeObjectSelect").text(loadedObject.name);
                    self.contentElement.find(".gn-nodeActionOpenChooseObject").show();
                });
            };

            /**
             * Loads the npc
             * @param {string} npcId Id of the npc
             */
            Actions.MoveChooseObjectToNpcAction.prototype.loadNpc = function(npcId) {
                if(!npcId) {
                    return;
                }

                var self = this;
                this.loadObjectShared({ loadType: loadTypeNpc, npcId: npcId }).then(function(npc) {
                    if(!npc) 
                    {
                        return;
                    }

                    self.contentElement.find(".gn-actionNodeNpcSelect").text(npc.name);
                    self.contentElement.find(".gn-nodeActionOpenObject").show();
                });
            };

            /**
             * Sets the related to data
             */
            Actions.MoveChooseObjectToNpcAction.prototype.setRelatedToData = function() {
                var additionalRelatedObjects = [];
                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                if(selectObjectAction.data("selectedobjectid"))
                {
                    this.nodeModel.set("actionRelatedToObjectType", this.getRelatedToObjectType());
                    this.nodeModel.set("actionRelatedToObjectId", selectObjectAction.data("selectedobjectid"));
                    
                }

                var selectNpcAction = this.contentElement.find(".gn-actionNodeNpcSelect");
                if(selectNpcAction.data("npcid"))
                {
                    additionalRelatedObjects.push({
                        objectType: Actions.RelatedToObjectNpc,
                        objectId: selectNpcAction.data("npcid")
                    });
                }

                this.nodeModel.set("actionRelatedToAdditionalObjects", additionalRelatedObjects);
            }

            /**
             * Saves the data
             */
            Actions.MoveChooseObjectToNpcAction.prototype.saveData = function() {
                this.setRelatedToData();
                
                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                var selectNpcAction = this.contentElement.find(".gn-actionNodeNpcSelect");

                var movementState = this.contentElement.find(".gn-nodeActionMovementState").val();
                if(!movementState)
                {
                    movementState = "";
                }

                var serializeData = {
                    objectId: selectObjectAction.data("selectedobjectid"),
                    npcId: selectNpcAction.data("npcid"),
                    movementState: movementState
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            
            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.MoveChooseObjectToNpcAction.prototype.getObjectId = function(existingData) {
                if(existingData.loadType == loadTypeNpc)
                {
                    return existingData.npcId;
                }

                return existingData.objectId;
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.MoveChooseObjectToNpcAction.prototype.getObjectResource = function(existingData) {
                if(existingData.loadType == loadTypeNpc)
                {
                    return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
                }

                return this.getObjectResourceType();
            };

            /**
             * Loads the npc
             * 
             * @param {string} objectId Extracted object id
             * @param {string} existingData Existing data
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.MoveChooseObjectToNpcAction.prototype.loadObject = function(objectId, existingData) {
                if(existingData.loadType == loadTypeNpc)
                {
                    var def = new jQuery.Deferred();

                    var selectNpcAction = this.contentElement.find(".gn-actionNodeNpcSelect");
                    jQuery.ajax({ 
                        url: "/api/KortistoApi/FlexFieldObject?id=" + selectNpcAction.data("npcid"), 
                        type: "GET"
                    }).done(function(data) {
                        def.resolve(data);
                    }).fail(function(xhr) {
                        def.reject();
                    });

                    return def.promise();
                }

                return this.loadChoosenObject(existingData.objectId);
            };
            
            /**
             * Returns the config key for the action
             * 
             * @returns {string} Config key
             */
            Actions.MoveChooseObjectToNpcAction.prototype.getConfigKey = function() {
                if(this.hasMovementState())
                {
                    return GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction;
                }

                return null;
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for teleporting an npc to an npc which is choosen
            var actionTypeTeleportChoseNpcToNpc = 45;

            /**
             * Teleport choose npc Action
             * @class
             */
            Actions.TeleportChooseNpcToNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveChooseObjectToNpcAction.apply(this);
            };

            Actions.TeleportChooseNpcToNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveChooseObjectToNpcAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.buildAction = function() {
                return new Actions.TeleportChooseNpcToNpcAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.getType = function() {
                return actionTypeTeleportChoseNpcToNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TeleportChooseNpcToNpcLabel;
            };
        

            /**
             * Opens the choose object dialog
             * 
             * @returns {jQuery.Deferred} Deferred that will be resolved with the choosen object
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.openChooseObjectDialog = function() {
                return GoNorth.DefaultNodeShapes.openNpcSearchDialog();
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.getChooseObjectLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseNpcLabel;
            };

            /**
             * Returns the selections seperator label
             * 
             * @returns {string} Label for seperation
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.getSelectionSeperatorLabel = function() {
                return DefaultNodeShapes.Localization.Actions.TeleportToNpc;
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.getOpenObjectTooltip = function() {
                return DefaultNodeShapes.Localization.Actions.OpenNpcTooltip;
            };

            /**
             * Opens the object
             * 
             * @param {string} id Id of the object
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.openObject = function(id) {
                window.open("/Kortisto/Npc?id=" + id)
            }

            /**
             * Returns the related object type of the choosen object
             * 
             * @returns {string} Related object type of the choosen object
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.getRelatedToObjectType = function() {
                return Actions.RelatedToObjectNpc;
            };

            /**
             * Returns the loading object resource type
             * 
             * @returns {number} Loading objcet resource type
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.getObjectResourceType = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the choosen object
             * 
             * @returns {number} Loading objcet resource type
             * @param {string} npcId Npc Id
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.TeleportChooseNpcToNpcAction.prototype.loadChoosenObject = function(npcId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + npcId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.TeleportChooseNpcToNpcAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for walking an npc to an npc
            var actionTypeWalkNpcToNpc = 46;

            /**
             * Walk npc to npc Action
             * @class
             */
            Actions.WalkNpcToNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveObjectToNpcAction.apply(this);
            };

            Actions.WalkNpcToNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveObjectToNpcAction.prototype);

            /**
             * Returns true if the action has a movement state, else false
             * 
             * @returns {bool} true if the action has a movement state, else false
             */
            Actions.WalkNpcToNpcAction.prototype.hasMovementState = function() {
                return true;
            };

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.WalkNpcToNpcAction.prototype.buildAction = function() {
                return new Actions.WalkNpcToNpcAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.WalkNpcToNpcAction.prototype.getType = function() {
                return actionTypeWalkNpcToNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.WalkNpcToNpcAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkNpcToNpcLabel;
            };
            /**
             * Returns the label for the main output
             * 
             * @returns {string} Label for the main output
             */
            Actions.WalkNpcToNpcAction.prototype.getMainOutputLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkOnTargetReachLabel;
            };

            /**
             * Returns the additional outports of the action
             * 
             * @returns {string[]} Additional outports
             */
            Actions.WalkNpcToNpcAction.prototype.getAdditionalOutports = function() {
                return [ DefaultNodeShapes.Localization.Actions.WalkDirectContinueLabel ];
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.WalkNpcToNpcAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for walking an npc to an npc which is choosen
            var actionTypeWalkChoseNpcToNpc = 47;

            /**
             * Walk choose npc Action
             * @class
             */
            Actions.WalkChooseNpcToNpcAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.MoveChooseObjectToNpcAction.apply(this);
            };

            Actions.WalkChooseNpcToNpcAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.MoveChooseObjectToNpcAction.prototype);

            /**
             * Returns true if the action has a movement state, else false
             * 
             * @returns {bool} true if the action has a movement state, else false
             */
            Actions.WalkChooseNpcToNpcAction.prototype.hasMovementState = function() {
                return true;
            };

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.WalkChooseNpcToNpcAction.prototype.buildAction = function() {
                return new Actions.WalkChooseNpcToNpcAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getType = function() {
                return actionTypeWalkChoseNpcToNpc;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkChooseNpcToNpcLabel;
            };
                
            /**
             * Returns the label for the main output
             * 
             * @returns {string} Label for the main output
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getMainOutputLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkOnTargetReachLabel;
            };

            /**
             * Returns the additional outports of the action
             * 
             * @returns {string[]} Additional outports
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getAdditionalOutports = function() {
                return [ DefaultNodeShapes.Localization.Actions.WalkDirectContinueLabel ];
            };


            /**
             * Opens the choose object dialog
             * 
             * @returns {jQuery.Deferred} Deferred that will be resolved with the choosen object
             */
            Actions.WalkChooseNpcToNpcAction.prototype.openChooseObjectDialog = function() {
                return GoNorth.DefaultNodeShapes.openNpcSearchDialog();
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getChooseObjectLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseNpcLabel;
            };

            /**
             * Returns the selections seperator label
             * 
             * @returns {string} Label for seperation
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getSelectionSeperatorLabel = function() {
                return DefaultNodeShapes.Localization.Actions.WalkToNpc;
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getOpenObjectTooltip = function() {
                return DefaultNodeShapes.Localization.Actions.OpenNpcTooltip;
            };

            /**
             * Opens the object
             * 
             * @param {string} id Id of the object
             */
            Actions.WalkChooseNpcToNpcAction.prototype.openObject = function(id) {
                window.open("/Kortisto/Npc?id=" + id)
            }

            /**
             * Returns the related object type of the choosen object
             * 
             * @returns {string} Related object type of the choosen object
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getRelatedToObjectType = function() {
                return Actions.RelatedToObjectNpc;
            };

            /**
             * Returns the loading object resource type
             * 
             * @returns {number} Loading objcet resource type
             */
            Actions.WalkChooseNpcToNpcAction.prototype.getObjectResourceType = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the choosen object
             * 
             * @returns {number} Loading objcet resource type
             * @param {string} npcId Npc Id
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.WalkChooseNpcToNpcAction.prototype.loadChoosenObject = function(npcId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + npcId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.WalkChooseNpcToNpcAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Indicating am object must be loaded
            var loadTypeObject = 0;

            /// Indicating a marker must be loaded
            var loadTypeMarker = 1;

            /**
             * Spawn object action
             * @class
             */
            Actions.SpawnChooseObjectAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.BaseAction.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Actions.SpawnChooseObjectAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.BaseAction.prototype);
            Actions.SpawnChooseObjectAction.prototype = jQuery.extend(Actions.SpawnChooseObjectAction.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the HTML Content of the action
             * 
             * @returns {string} HTML Content of the action
             */
            Actions.SpawnChooseObjectAction.prototype.getContent = function() {
                return "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<a class='gn-actionNodeObjectSelect gn-clickable'>" + this.getChooseObjectLabel() + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenChooseObject' title='" + this.getOpenObjectTooltip() + "' style='display: none'><i class='glyphicon glyphicon-eye-open'></i></a>" +
                        "</div>" + 
                        "<div class='gn-actionNodeObjectSelectionSeperator'>" + this.getSelectionSeperatorLabel() + "</div>" +
                        "<div class='gn-actionNodeObjectSelectContainer gn-spawnObjectMarkerActionContainer'>" +
                            "<a class='gn-actionNodeMarkerSelect gn-spawnObjectMarkerAction gn-clickable'>" + DefaultNodeShapes.Localization.Actions.ChooseMarkerLabel + "</a>" +
                            "<a class='gn-clickable gn-nodeActionOpenObject' title='" + DefaultNodeShapes.Localization.Actions.OpenMarkerTooltip + "' style='display: none'><i class='glyphicon glyphicon-eye-open gn-spawnObjectMarkerActionOpenIcon'></i></a>" +
                        "</div>" +
                        "<div class='gn-actionNodeObjectSelectionSeperator'>" + DefaultNodeShapes.Localization.Actions.RotationLabel + "</div>" +
                        "<div class='gn-actionNodeObjectSelectContainer'>" +
                            "<input type='text' class='gn-actionNodeObjectSpawnRotation gn-actionNodeObjectSpawnRotationPitch' placeholder='" + DefaultNodeShapes.Localization.Actions.PitchLabel + "' value='0'/>" +
                            "<input type='text' class='gn-actionNodeObjectSpawnRotation gn-actionNodeObjectSpawnRotationYaw' placeholder='" + DefaultNodeShapes.Localization.Actions.YawLabel + "' value='0'/>" +
                            "<input type='text' class='gn-actionNodeObjectSpawnRotation gn-actionNodeObjectSpawnRotationRoll' placeholder='" + DefaultNodeShapes.Localization.Actions.RollLabel + "' value='0'/>" +
                        "</div>";
            };

            /**
             * Gets called once the action was intialized
             * 
             * @param {object} contentElement Content element
             * @param {ActionNode} actionNode Parent Action node
             */
            Actions.SpawnChooseObjectAction.prototype.onInitialized = function(contentElement, actionNode) {
                this.contentElement = contentElement;

                var objectOpenLink = contentElement.find(".gn-nodeActionOpenChooseObject");
                var markerOpenLink = contentElement.find(".gn-nodeActionOpenObject");

                // Deserialize
                var deserializedData = this.deserializeData();
                if(deserializedData) {
                    this.loadObjectFromDeserialize(deserializedData.objectId);
                    this.loadMarkerFromMap(deserializedData.mapId, deserializedData.markerId);

                    contentElement.find(".gn-actionNodeObjectSpawnRotationPitch").val(deserializedData.pitch ? deserializedData.pitch : 0);
                    contentElement.find(".gn-actionNodeObjectSpawnRotationYaw").val(deserializedData.yaw ? deserializedData.yaw : 0);
                    contentElement.find(".gn-actionNodeObjectSpawnRotationRoll").val(deserializedData.roll ? deserializedData.roll : 0);
                }

                // Handlers
                var self = this;
                var selectObjectAction = contentElement.find(".gn-actionNodeObjectSelect");
                selectObjectAction.on("click", function() {
                    self.openChooseObjectDialog().then(function(object) {
                        selectObjectAction.data("selectedobjectid", object.id);
                        selectObjectAction.text(object.name);
                        
                        self.saveData();

                        objectOpenLink.show();
                    });
                });

                objectOpenLink.on("click", function() {
                    if(selectObjectAction.data("selectedobjectid"))
                    {
                        self.openObject(selectObjectAction.data("selectedobjectid"))
                    }
                });


                var selectMarkerAction = contentElement.find(".gn-actionNodeMarkerSelect");
                selectMarkerAction.on("click", function() {
                    GoNorth.DefaultNodeShapes.openMarkerSearchDialog().then(function(marker) {
                        selectMarkerAction.data("mapid", marker.mapId);
                        selectMarkerAction.data("markerid", marker.id);
                        selectMarkerAction.data("markertype", marker.markerType);
                        selectMarkerAction.text(marker.name);
                        selectMarkerAction.prop("title", marker.name);
                        
                        self.saveData();

                        markerOpenLink.show();
                    });
                });
                 
                markerOpenLink.on("click", function() {
                    if(selectMarkerAction.data("markerid"))
                    {
                        window.open("/Karta?id=" + selectMarkerAction.data("mapid") + "&zoomOnMarkerId=" + selectMarkerAction.data("markerid") + "&zoomOnMarkerType=" + selectMarkerAction.data("markertype"))
                    }
                });


                var nodeObjectSpawnRotation = contentElement.find(".gn-actionNodeObjectSpawnRotation");
                nodeObjectSpawnRotation.keydown(function(e) {
                    GoNorth.Util.validateNumberKeyPress(jQuery(this), e);
                });

                nodeObjectSpawnRotation.change(function(e) {
                    self.ensureNumberValue(jQuery(this));
                    self.saveData();
                });
            };

            /**
             * Ensures a number value for an input element
             * 
             * @param {object} rotationElement Element with the rotation
             */
            Actions.SpawnChooseObjectAction.prototype.ensureNumberValue = function(rotationElement) {
                var parsedValue = parseInt(rotationElement.val());
                if(isNaN(parsedValue))
                {
                    rotationElement.val("");
                }
            };

            /**
             * Deserializes the data
             */
            Actions.SpawnChooseObjectAction.prototype.deserializeData = function() {
                var actionData = this.nodeModel.get("actionData");
                if(!actionData)
                {
                    return null;
                }

                var data = JSON.parse(actionData);

                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                selectObjectAction.data("selectedobjectid", data.objectId);

                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");
                selectMarkerAction.data("mapid", data.mapId);
                selectMarkerAction.data("markerid", data.markerId);
                selectMarkerAction.data("markertype", data.markerType);

                this.setRelatedToData();

                return data;
            };

            /**
             * Loads the marker from a map
             * @param {string} mapId Id of the map
             * @param {string} markerId Id of the marker
             */
            Actions.SpawnChooseObjectAction.prototype.loadObjectFromDeserialize = function(objectId) {
                if(!objectId) {
                    return;
                }

                var self = this;
                this.loadObjectShared({ loadType: loadTypeObject, objectId: objectId }).then(function(loadedObject) {
                    if(!loadedObject) 
                    {
                        return;
                    }

                    self.contentElement.find(".gn-actionNodeObjectSelect").text(loadedObject.name);
                    self.contentElement.find(".gn-nodeActionOpenChooseObject").show();
                });
            };

            /**
             * Loads the marker from a map
             * @param {string} mapId Id of the map
             * @param {string} markerId Id of the marker
             */
            Actions.SpawnChooseObjectAction.prototype.loadMarkerFromMap = function(mapId, markerId) {
                if(!mapId || !markerId) {
                    return;
                }

                var self = this;
                this.loadObjectShared({ loadType: loadTypeMarker, mapId: mapId, markerId: markerId }).then(function(marker) {
                    if(!marker) 
                    {
                        return;
                    }

                    var markerName = marker.markerName + " (" + marker.mapName + ")";
                    self.contentElement.find(".gn-actionNodeMarkerSelect").text(markerName);
                    self.contentElement.find(".gn-actionNodeMarkerSelect").prop("title", markerName);
                    self.contentElement.find(".gn-nodeActionOpenObject").show();
                });
            };

            /**
             * Sets the related to data
             */
            Actions.SpawnChooseObjectAction.prototype.setRelatedToData = function() {
                var additionalRelatedObjects = [];
                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                if(selectObjectAction.data("selectedobjectid"))
                {
                    this.nodeModel.set("actionRelatedToObjectType", this.getRelatedToObjectType());
                    this.nodeModel.set("actionRelatedToObjectId", selectObjectAction.data("selectedobjectid"));
                    
                }

                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");
                if(selectMarkerAction.data("markerid"))
                {
                    additionalRelatedObjects.push({
                        objectType: Actions.RelatedToObjectMapMarker,
                        objectId: selectMarkerAction.data("markerid")
                    });
                }

                if(selectMarkerAction.data("mapid"))
                {
                    additionalRelatedObjects.push({
                        objectType: Actions.RelatedToObjectMap,
                        objectId: selectMarkerAction.data("mapid")
                    });
                }
                this.nodeModel.set("actionRelatedToAdditionalObjects", additionalRelatedObjects);
            }

            /**
             * Saves the data
             */
            Actions.SpawnChooseObjectAction.prototype.saveData = function() {
                this.setRelatedToData();
                
                var selectObjectAction = this.contentElement.find(".gn-actionNodeObjectSelect");
                var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");

                var serializeData = {
                    objectId: selectObjectAction.data("selectedobjectid"),
                    mapId: selectMarkerAction.data("mapid"),
                    markerId: selectMarkerAction.data("markerid"),
                    markerType: selectMarkerAction.data("markertype"),
                    pitch: this.extractRotationValue(this.contentElement.find(".gn-actionNodeObjectSpawnRotationPitch")),
                    yaw: this.extractRotationValue(this.contentElement.find(".gn-actionNodeObjectSpawnRotationYaw")),
                    roll: this.extractRotationValue(this.contentElement.find(".gn-actionNodeObjectSpawnRotationRoll"))
                };

                this.nodeModel.set("actionData", JSON.stringify(serializeData));
            };

            /**
             * Extracts a rotation value
             * 
             * @param {object} rotationElement Element with the rotation
             * @returns {float} Rotation
             */
            Actions.SpawnChooseObjectAction.prototype.extractRotationValue = function(rotationElement) {
                var parsedValue = parseInt(rotationElement.val());
                if(isNaN(parsedValue))
                {
                    return 0;
                }

                return parsedValue;
            };

            
            /**
             * Returns the object id
             * 
             * @returns {string} Object Id
             */
            Actions.SpawnChooseObjectAction.prototype.getObjectId = function(existingData) {
                if(existingData.loadType == loadTypeMarker)
                {
                    return existingData.mapId + "|" + existingData.markerId;
                }

                return existingData.objectId;
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.SpawnChooseObjectAction.prototype.getObjectResource = function(existingData) {
                if(existingData.loadType == loadTypeMarker)
                {
                    return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceMapMarker;
                }

                return this.getObjectResourceType();
            };

            /**
             * Loads the marker or object
             * 
             * @param {string} objectId Extracted object id
             * @param {string} existingData Existing data
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.SpawnChooseObjectAction.prototype.loadObject = function(objectId, existingData) {
                if(existingData.loadType == loadTypeMarker)
                {
                    var def = new jQuery.Deferred();

                    var selectMarkerAction = this.contentElement.find(".gn-actionNodeMarkerSelect");
                    jQuery.ajax({ 
                        url: "/api/KartaApi/GetMarker?mapId=" + selectMarkerAction.data("mapid") + "&markerId=" + selectMarkerAction.data("markerid"), 
                        type: "GET"
                    }).done(function(data) {
                        def.resolve(data);
                    }).fail(function(xhr) {
                        def.reject();
                    });

                    return def.promise();
                }

                return this.loadChoosenObject(existingData.objectId);
            };

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for spawning an npc at a marker
            var actionTypeSpawnNpcAtMarker = 48;

            /**
             * Spawn npc at marker Action
             * @class
             */
            Actions.SpawnNpcAtMarkerAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.SpawnChooseObjectAction.apply(this);
            };

            Actions.SpawnNpcAtMarkerAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.SpawnChooseObjectAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SpawnNpcAtMarkerAction.prototype.buildAction = function() {
                return new Actions.SpawnNpcAtMarkerAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SpawnNpcAtMarkerAction.prototype.getType = function() {
                return actionTypeSpawnNpcAtMarker;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SpawnNpcAtMarkerAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SpawnNpcAtMarkerLabel;
            };
        

            /**
             * Opens the choose object dialog
             * 
             * @returns {jQuery.Deferred} Deferred that will be resolved with the choosen object
             */
            Actions.SpawnNpcAtMarkerAction.prototype.openChooseObjectDialog = function() {
                return GoNorth.DefaultNodeShapes.openNpcSearchDialog();
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.SpawnNpcAtMarkerAction.prototype.getChooseObjectLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseNpcLabel;
            };

            /**
             * Returns the selections seperator label
             * 
             * @returns {string} Label for seperation
             */
            Actions.SpawnNpcAtMarkerAction.prototype.getSelectionSeperatorLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SpawnAt;
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.SpawnNpcAtMarkerAction.prototype.getOpenObjectTooltip = function() {
                return DefaultNodeShapes.Localization.Actions.OpenNpcTooltip;
            };

            /**
             * Opens the object
             * 
             * @param {string} id Id of the object
             */
            Actions.SpawnNpcAtMarkerAction.prototype.openObject = function(id) {
                window.open("/Kortisto/Npc?id=" + id)
            }

            /**
             * Returns the related object type of the choosen object
             * 
             * @returns {string} Related object type of the choosen object
             */
            Actions.SpawnNpcAtMarkerAction.prototype.getRelatedToObjectType = function() {
                return Actions.RelatedToObjectNpc;
            };

            /**
             * Returns the loading object resource type
             * 
             * @returns {number} Loading objcet resource type
             */
            Actions.SpawnNpcAtMarkerAction.prototype.getObjectResourceType = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the choosen object
             * 
             * @returns {number} Loading objcet resource type
             * @param {string} npcId Npc Id
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.SpawnNpcAtMarkerAction.prototype.loadChoosenObject = function(npcId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + npcId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SpawnNpcAtMarkerAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Actions) {

            /// Action Type for spawning an item at a marker
            var actionTypeSpawnItemAtMarker = 49;

            /**
             * Spawn item at marker Action
             * @class
             */
            Actions.SpawnItemAtMarkerAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.SpawnChooseObjectAction.apply(this);
            };

            Actions.SpawnItemAtMarkerAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.SpawnChooseObjectAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SpawnItemAtMarkerAction.prototype.buildAction = function() {
                return new Actions.SpawnItemAtMarkerAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SpawnItemAtMarkerAction.prototype.getType = function() {
                return actionTypeSpawnItemAtMarker;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SpawnItemAtMarkerAction.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SpawnItemAtMarkerLabel;
            };
        

            /**
             * Opens the choose object dialog
             * 
             * @returns {jQuery.Deferred} Deferred that will be resolved with the choosen object
             */
            Actions.SpawnItemAtMarkerAction.prototype.openChooseObjectDialog = function() {
                return GoNorth.DefaultNodeShapes.openItemSearchDialog();
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.SpawnItemAtMarkerAction.prototype.getChooseObjectLabel = function() {
                return DefaultNodeShapes.Localization.Actions.ChooseItemLabel;
            };

            /**
             * Returns the selections seperator label
             * 
             * @returns {string} Label for seperation
             */
            Actions.SpawnItemAtMarkerAction.prototype.getSelectionSeperatorLabel = function() {
                return DefaultNodeShapes.Localization.Actions.SpawnAt;
            };

            /**
             * Returns the choose label
             * 
             * @returns {string} Label for choosing
             */
            Actions.SpawnItemAtMarkerAction.prototype.getOpenObjectTooltip = function() {
                return DefaultNodeShapes.Localization.Actions.OpenItemTooltip;
            };

            /**
             * Opens the object
             * 
             * @param {string} id Id of the object
             */
            Actions.SpawnItemAtMarkerAction.prototype.openObject = function(id) {
                window.open("/Styr/Item?id=" + id)
            }

            /**
             * Returns the related object type of the choosen object
             * 
             * @returns {string} Related object type of the choosen object
             */
            Actions.SpawnItemAtMarkerAction.prototype.getRelatedToObjectType = function() {
                return Actions.RelatedToObjectItem;
            };

            /**
             * Returns the loading object resource type
             * 
             * @returns {number} Loading objcet resource type
             */
            Actions.SpawnItemAtMarkerAction.prototype.getObjectResourceType = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceItem;
            };

            /**
             * Loads the choosen object
             * 
             * @returns {number} Loading objcet resource type
             * @param {string} itemId Item Id
             * @returns {jQuery.Deferred} Deferred for the objcet loading
             */
            Actions.SpawnItemAtMarkerAction.prototype.loadChoosenObject = function(itemId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/StyrApi/FlexFieldObject?id=" + itemId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SpawnItemAtMarkerAction());

        }(DefaultNodeShapes.Actions = DefaultNodeShapes.Actions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /**
             * Condition Manager
             * @class
             */
            var conditionManager = function()
            {
                this.availableConditionTypes = [];
            };

            conditionManager.prototype = {
                /**
                 * Adds a new condition type to the manager
                 * 
                 * @param {object} condition Condition type to add
                 */
                addConditionType: function(condition) {
                    this.availableConditionTypes.push(condition);
                },

                /**
                 * Returns the available condition types
                 * 
                 * @returns {object} Condition Types
                 */
                getConditionTypes: function() {
                    return this.availableConditionTypes;
                },

                /**
                 * Returns the available condition types which can be selected
                 * 
                 * @returns {object} Condition Types which can be selected
                 */
                getSelectableConditionTypes: function() {
                    var selectableConditionTypes = [];
                    for(var curConditionType = 0; curConditionType < this.availableConditionTypes.length; ++curConditionType)
                    {
                        if(this.availableConditionTypes[curConditionType].canBeSelected())
                        {
                            selectableConditionTypes.push(this.availableConditionTypes[curConditionType]);
                        }
                    }
                    return selectableConditionTypes;
                },

                /**
                 * Returns the available condition types
                 * 
                 * @param {number} type Type of the condition
                 * @returns {string} Condition template
                 */
                getConditionTemplate: function(type) {
                    var conditionType = this.getConditionType(type);
                    if(conditionType)
                    {
                        return conditionType.getTemplateName();
                    }

                    return "gn-nodeConditionEmpty";
                },

                /**
                 * Returns true if a condition type is selectable, else false
                 * 
                 * @param {number} type Type of the condition
                 * @returns {bool} true if the condition type is selectable, else false
                 */
                isConditionTypeSelectable: function(type) {
                    var conditionType = this.getConditionType(type);
                    if(conditionType)
                    {
                        return conditionType.canBeSelected();
                    }

                    return true;
                },

                /**
                 * Builds the condition data
                 * 
                 * @param {number} type Type of the condition
                 * @param {object} existingData Existing data
                 * @param {object} element Element to which the data belongs
                 * @returns {object} Condition data
                 */
                buildConditionData: function(type, existingData, element) {
                    element.errorOccured(false);
                    var conditionType = this.getConditionType(type);
                    if(conditionType)
                    {
                        return conditionType.buildConditionData(existingData, element);
                    }

                    return null;
                },

                /**
                 * Serializes a condition
                 * 
                 * @param {object} existingData Existing Condition Data
                 * @returns {object} Serialized condition data
                 */
                serializeCondition: function(existingData) {
                    var serializedCondition = {
                        id: existingData.id,
                        dependsOnObjects: Conditions.getConditionManager().getConditionElementsDependsOnObject(existingData.conditionElements),
                        conditionElements: JSON.stringify(existingData.conditionElements)
                    };
                    return serializedCondition;
                },

                /**
                 * Deserializes a condition
                 * 
                 * @param {object} serializedCondition Serialized condition
                 * @returns {object} Deserialized condition data
                 */
                deserializeCondition: function(serializedCondition) {
                    var existingData = {
                        id: serializedCondition.id,
                        conditionElements: JSON.parse(serializedCondition.conditionElements)
                    };
                    return existingData;
                },

                /**
                 * Serializes a condition element
                 * 
                 * @param {object} conditionElement Condition Element
                 * @returns {object} Serialized Condition Element
                 */
                serializeConditionElement: function(conditionElement) {
                    var conditionType = this.getConditionType(conditionElement.conditionType());
                    if(conditionType)
                    {
                        return {
                            conditionType: conditionElement.conditionType(),
                            conditionData: conditionType.serializeConditionData(conditionElement.conditionData())
                        }
                    }

                    return null;
                },

                /**
                 * Returns the objects on which a group of condition element depends
                 * 
                 * @param {number} type Type of the condition
                 * @param {object} existingData Existing condition data
                 * @returns {object[]} Data of objects on which the condition element depends
                 */
                getConditionElementsDependsOnObject: function(conditionElements) {
                    var pushedObjects = {};
                    var allDependencies = [];
                    for(var curElement = 0; curElement < conditionElements.length; ++curElement)
                    {
                        var elementDependencies = Conditions.getConditionManager().getConditionElementDependsOnObject(conditionElements[curElement].conditionType, conditionElements[curElement].conditionData);
                        for(var curDependency = 0; curDependency < elementDependencies.length; ++curDependency)
                        {
                            var key = elementDependencies[curDependency].objectType + "|" + elementDependencies[curDependency].objectId;
                            if(!pushedObjects[key])
                            {
                                allDependencies.push(elementDependencies[curDependency]);
                                pushedObjects[key] = true;
                            }
                        }
                    }
                    return allDependencies;
                },

                /**
                 * Returns the objects on which a condition element depends
                 * 
                 * @param {number} type Type of the condition
                 * @param {object} existingData Existing condition data
                 * @returns {object[]} Data of objects on which the condition element depends
                 */
                getConditionElementDependsOnObject: function(type, existingData) {
                    var conditionType = this.getConditionType(type);
                    if(conditionType)
                    {
                        return conditionType.getConditionDependsOnObject(existingData);
                    }
                    return [];
                },
                
                /**
                 * Returns the condition type
                 * 
                 * @param {number} type Type of the condition
                 * @returns {object} Condition Type
                 */
                getConditionType: function(type) {
                    for(var curConditionType = 0; curConditionType < this.availableConditionTypes.length; ++curConditionType)
                    {
                        if(this.availableConditionTypes[curConditionType].getType() == type)
                        {
                            return this.availableConditionTypes[curConditionType];
                        }
                    }

                    return null;
                },

                /**
                 * Converts the condition elements
                 * 
                 * @param {object[]} elements Elements to convert
                 */
                convertElements: function(elements) {
                    var convertedElements = [];
                    for(var curElement = 0; curElement < elements.length; ++curElement)
                    {
                        var element = this.convertElement(elements[curElement]);
                        convertedElements.push(element);
                    }

                    return convertedElements;
                },

                /**
                 * Convertes an element
                 * 
                 * @param {object} element Element to convert
                 * @returns {object} Condition Element
                 */
                convertElement: function(element) {
                    var convertedElement = {
                        isSelected: new ko.observable(false),
                        conditionType: new ko.observable(element.conditionType),
                        conditionData: new ko.observable(null),
                        conditionTemplate: new ko.observable("gn-nodeConditionEmpty"),
                        parent: null,
                        errorOccured: new ko.observable(false)
                    };
                    convertedElement.conditionData(this.buildConditionData(element.conditionType, element.conditionData, convertedElement));
                    convertedElement.conditionTemplate(this.getConditionTemplate(element.conditionType));
                    this.addSharedFunctions(convertedElement);

                    return convertedElement;
                },

                /**
                 * Creates an empty element
                 * 
                 * @returns {object} Condition Element
                 */
                createEmptyElement: function() {
                    var element = {
                        isSelected: new ko.observable(false),
                        conditionType: new ko.observable(""),
                        conditionData: new ko.observable(null),
                        conditionTemplate: new ko.observable("gn-nodeConditionEmpty"),
                        parent: null,
                        errorOccured: new ko.observable(false)
                    };
                    this.addSharedFunctions(element);
                    return element;
                },

                /**
                 * Adds the shared functions to a condition
                 * 
                 * @param {object} element Condition Element
                 */
                addSharedFunctions: function(element) {
                    var self = this;
                    element.conditionType.subscribe(function() {
                        element.conditionTemplate("gn-nodeConditionEmpty");
                        element.conditionData(self.buildConditionData(element.conditionType(), null, element));
                        element.conditionTemplate(self.getConditionTemplate(element.conditionType()));
                    });
                },


                /**
                 * Returns the condition string for a condition
                 * @param {object[]} conditionElements Condition Elements
                 * @param {string} joinOperator Operator used for the join
                 * @param {bool} addBrackets true if brackets should be added around the result, else false
                 * @returns {jQuery.Deferred} Deferred for loading the text
                 */
                getConditionString: function(conditionElements, joinOperator, addBrackets) {
                    var conditionDef = new jQuery.Deferred();

                    var allElementsDef = [];
                    for(var curElement = 0; curElement < conditionElements.length; ++curElement)
                    {
                        var conditionType = this.getConditionType(conditionElements[curElement].conditionType);
                        allElementsDef.push(conditionType.getConditionString(conditionElements[curElement].conditionData));
                    }

                    jQuery.when.apply(jQuery, allElementsDef).then(function() {
                        if(arguments.length == 0)
                        {
                            conditionDef.resolve("");
                            return;
                        }

                        var allTextLines = [];
                        for(var curArgument = 0; curArgument < arguments.length; ++curArgument)
                        {
                            allTextLines.push(arguments[curArgument]);
                        }
                        var joinedValue = allTextLines.join(" " + joinOperator + " ");
                        if(addBrackets)
                        {
                            joinedValue = "(" + joinedValue + ")";
                        }
                        conditionDef.resolve(joinedValue);
                    }, function(err) {
                        conditionDef.reject(err);
                    });

                    return conditionDef.promise();
                }
            };


            var instance = new conditionManager();

            /**
             * Returns the condition manager instance
             * 
             * @returns {conditionManager} Condition Manager
             */
            Conditions.getConditionManager = function() {
                return instance;
            }

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Conditions that are related to npcs
            Conditions.RelatedToObjectNpc = "Npc";

            /// Conditions that are related to items
            Conditions.RelatedToObjectItem = "Item";

            /// Conditions that are related to quests
            Conditions.RelatedToObjectQuest = "Quest";

            /// Conditions that are related to skills
            Conditions.RelatedToObjectSkill = "Skill";

            /**
             * Base Condition
             * @class
             */
            Conditions.BaseCondition = function()
            {
                this.nodeModel = null;
            };

            Conditions.BaseCondition.prototype = {
                /**
                 * Returns the type of the condition
                 * 
                 * @returns {number} Type of the condition
                 */
                getType: function() {
                    return -1;
                },

                /**
                 * Returns the label of the condition
                 * 
                 * @returns {string} Label of the condition
                 */
                getLabel: function() {

                },

                /**
                 * Returns true if the condition can be selected in the dropdown list, else false
                 * 
                 * @returns {bool} true if the condition can be selected, else false
                 */
                canBeSelected: function() {

                },

                /**
                 * Returns the template name for the condition
                 * 
                 * @returns {string} Template name
                 */
                getTemplateName: function() {

                },
                
                /**
                 * Returns the data for the condition
                 * 
                 * @param {object} existingData Existing condition data
                 * @param {object} element Element to which the data belongs
                 * @returns {object} Template data
                 */
                buildConditionData: function(existingData, element) {

                },

                /**
                 * Serializes condition data
                 * 
                 * @param {object} conditionData Condition data
                 * @returns {object} Serialized data
                 */
                serializeConditionData: function(conditionData) {

                },
                
                /**
                 * Returns the objects on which an object depends
                 * 
                 * @param {object} existingData Existing condition data
                 * @returns {object[]} Objects on which the condition depends
                 */
                getConditionDependsOnObject: function(existingData) {

                },


                /**
                 * Returns the condition data as a display string
                 * 
                 * @param {object} existingData Serialzied condition data
                 * @returns {jQuery.Deferred} Deferred for the loading process
                 */
                getConditionString: function(existingData) {

                }
            };

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {
            
            /// Group Condition type
            Conditions.GroupConditionType = 1;


            /// And Operator for group conditions
            Conditions.GroupConditionOperatorAnd = 0;

            /// Or Operator for group conditions
            Conditions.GroupConditionOperatorOr = 1;

            /**
             * Group condition (and/or)
             * @class
             */
            Conditions.GroupCondition = function()
            {
                Conditions.BaseCondition.apply(this);
            };

            Conditions.GroupCondition.prototype = jQuery.extend({ }, Conditions.BaseCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.GroupCondition.prototype.getType = function() {
                return Conditions.GroupConditionType;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.GroupCondition.prototype.getLabel = function() {
                return "";
            };

            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.GroupCondition.prototype.canBeSelected = function() {
                return false;
            };

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.GroupCondition.prototype.getTemplateName = function() {
                return "gn-nodeConditionGroup";
            }

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.GroupCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = {
                    operator: new ko.observable(existingData.operator),
                    conditionElements: new ko.observableArray()
                };
                
                if(existingData.fromDialog)
                {
                    conditionData.conditionElements(existingData.conditionElements);
                }
                else
                {
                    var convertedElements = Conditions.getConditionManager().convertElements(existingData.conditionElements);
                    for(var curElement = 0; curElement < convertedElements.length; ++curElement)
                    {
                        convertedElements[curElement].parent = element;
                    }
                    conditionData.conditionElements(convertedElements);
                }

                conditionData.operatorText = new ko.computed(function() {
                    return conditionData.operator() == Conditions.GroupConditionOperatorAnd ? DefaultNodeShapes.Localization.Conditions.AndOperator : DefaultNodeShapes.Localization.Conditions.OrOperator;
                });

                conditionData.toggleOperator = function() {
                    if(conditionData.operator() == Conditions.GroupConditionOperatorAnd)
                    {
                        conditionData.operator(Conditions.GroupConditionOperatorOr);
                    }
                    else
                    {
                        conditionData.operator(Conditions.GroupConditionOperatorAnd);
                    }
                };

                return conditionData;
            }

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.GroupCondition.prototype.serializeConditionData = function(conditionData) {
                var serializedData = {
                    operator: conditionData.operator(),
                    conditionElements: []
                };

                var conditionElements = conditionData.conditionElements();
                for(var curElement = 0; curElement < conditionElements.length; ++curElement)
                {
                    var element = Conditions.getConditionManager().serializeConditionElement(conditionElements[curElement]);
                    serializedData.conditionElements.push(element);
                }
                return serializedData;
            }

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.GroupCondition.prototype.getConditionDependsOnObject = function(existingData) {
                return Conditions.getConditionManager().getConditionElementsDependsOnObject(existingData.conditionElements);
            }


            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialzied condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.GroupCondition.prototype.getConditionString = function(existingData) {
                return Conditions.getConditionManager().getConditionString(existingData.conditionElements, existingData.operator == Conditions.GroupConditionOperatorAnd ? DefaultNodeShapes.Localization.Conditions.AndOperatorShort : DefaultNodeShapes.Localization.Conditions.OrOperatorShort, true);
            }

            Conditions.getConditionManager().addConditionType(new Conditions.GroupCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /**
             * Check value condition
             * @class
             */
            Conditions.CheckValueCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);

                this.fieldObjectId = "";
            };

            Conditions.CheckValueCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);
            Conditions.CheckValueCondition.prototype = jQuery.extend(Conditions.CheckValueCondition.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckValueCondition.prototype.getTemplateName = function() {
                return "gn-nodeConditionValueCheck";
            };
            
            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckValueCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Function to allow additional object condition data to be processed after loading
             * 
             * @param {object} conditionData Condition data build by calling buildConditionData before
             * @param {object} loadedObject Loaded object
             */
            Conditions.CheckValueCondition.prototype.processAditionalLoadedObjectConditionData = function(conditionData, loadedObject) {
                
            };

            /**
             * Returns the selected field, null if no field was found
             * 
             * @param {object} existingData Existing condition data
             * @param {objec[]} fields Flex fields
             * @returns {object} Selected field
             */
            Conditions.CheckValueCondition.prototype.getSelectedField = function(existingData, fields) {
                var selectedField = null;
                for(var curField = 0; curField < fields.length; ++curField)
                {
                    if(fields[curField].id == existingData.fieldId)
                    {
                        selectedField = fields[curField];
                        
                        if(fields[curField].name == existingData.fieldName)
                        {
                            break;
                        }
                    }
                }
                return selectedField;
            };

            
            /**
             * Returns the data for the condition without trying to load field data
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckValueCondition.prototype.buildConditionDataNoLoad = function(existingData, element) {
                var conditionData = {
                    selectedField: new ko.observable(),
                    operator: new ko.observable(),
                    compareValue: new ko.observable(),
                    availableFields: new ko.observable()
                };
                if(existingData)
                {
                    conditionData.compareValue(existingData.compareValue ? existingData.compareValue : null);
                }

                conditionData.validateInput = function(data, e) {
                    if(conditionData.selectedField().fieldType != GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldTypeNumber)
                    {
                        return true;
                    }

                    var keypressValid = GoNorth.Util.validateNumberKeyPress(e.target, e);
                    return keypressValid;
                };

                conditionData.availableOperators = new ko.computed(function() {
                    if(!this.selectedField())
                    {
                        return [];
                    }

                    var operators = [ "=", "!=", "contains", "startsWith", "endsWith" ];
                    if(this.selectedField().fieldType == GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldTypeNumber)
                    {
                        operators = [ "=", "!=", "<=", "<", ">=", ">" ];
                    }
                    return operators;
                }, conditionData);

                conditionData.selectedField.subscribe(function() {
                    if(conditionData.selectedField().fieldType != GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldTypeNumber)
                    {
                        return;
                    }

                    var parsedValue =  parseFloat(conditionData.compareValue());
                    if(isNaN(parsedValue))
                    {
                        conditionData.compareValue("0");
                    }
                });

                return conditionData;
            };

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckValueCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = this.buildConditionDataNoLoad(existingData, element);

                // Load field data
                if(this.canLoadFieldObject(existingData))
                {
                    this.loadAndParseFields(conditionData, existingData, element);
                }

                return conditionData;
            };
            
            /**
             * Returns true if the field object can be loaded, else false
             * 
             * @param {object} existingData Existing data
             * @returns {bool} true if the object can be loaded, else false
             */
            Conditions.CheckValueCondition.prototype.canLoadFieldObject = function(existingData) {
                return true;
            }

            /**
             * Loads and parses the fields for the condition dialog
             * 
             * @param {object} conditionData Condition Data 
             * @param {object} existingData Existing Data
             * @param {object} element Element
             */
            Conditions.CheckValueCondition.prototype.loadAndParseFields = function(conditionData, existingData, element)
            {
                var self = this;
                this.loadObjectShared(existingData).then(function(fieldObject) {
                    if(!fieldObject)
                    {
                        return;
                    }

                    self.fieldObjectId = fieldObject.id;
                    var filteredFields = GoNorth.Util.getFilteredFieldsForScript(fieldObject.fields);
                    for(var curField = 0; curField < filteredFields.length; ++curField)
                    {
                        var displayName = filteredFields[curField].name + " (";
                        if(filteredFields[curField].fieldType == GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldTypeNumber)
                        {
                            displayName += DefaultNodeShapes.Localization.Conditions.NumberField;
                        }
                        else
                        {
                            displayName += DefaultNodeShapes.Localization.Conditions.TextField;
                        }
                        displayName += ")";
                        filteredFields[curField].displayName = displayName;
                    }

                    conditionData.availableFields(filteredFields);
                    
                    // Load old data
                    if(existingData)
                    {
                        var selectedField = self.getSelectedField(existingData, filteredFields);
                        if(selectedField)
                        {
                            conditionData.selectedField(selectedField);
                        }
                        conditionData.operator(existingData.operator ? existingData.operator : null);
                    }

                    // Additional processing
                    self.processAditionalLoadedObjectConditionData(conditionData, fieldObject);
                }, function(err) {
                    element.errorOccured(true);
                });
            }

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckValueCondition.prototype.serializeConditionData = function(conditionData) {
                return {
                    fieldId: conditionData.selectedField() ? conditionData.selectedField().id : null,
                    fieldName: conditionData.selectedField() ? conditionData.selectedField().name : null,
                    operator: conditionData.operator(),
                    compareValue: conditionData.compareValue() ? conditionData.compareValue() : null
                };
            };

            /**
             * Returns the object id for dependency checks
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id on which the condition depends
             */
            Conditions.CheckValueCondition.prototype.getDependsOnObjectId = function(existingData) {
                return this.fieldObjectId;
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckValueCondition.prototype.getConditionDependsOnObject = function(existingData) {
                var objectId = this.getDependsOnObjectId(existingData);

                return [{
                    objectType: this.getObjectTypeName(),
                    objectId: objectId
                }];
            }

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Conditions.CheckValueCondition.prototype.getObjectTypeName = function() {

            };

            /**
             * Returns the title of the field object used in the string representation
             * 
             * @param {object} loadedFieldObject Loaded Field object for returning name if necessary
             * @returns {string} Title of the field object
             */
            Conditions.CheckValueCondition.prototype.getObjectTitle = function(loadedFieldObject) {
                
            };

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialized condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckValueCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                
                // Check if data is valid
                if(!this.canLoadFieldObject(existingData) || existingData.fieldId == null)
                {
                    def.resolve(DefaultNodeShapes.Localization.Conditions.MissingInformations);
                    return def.promise();
                }

                // Load data and build string
                var self = this;
                this.loadObjectShared(existingData).then(function(fieldObject) {
                    self.fieldObjectId = fieldObject.id;
                    var filteredFields = GoNorth.Util.getFilteredFieldsForScript(fieldObject.fields);
                    var selectedField = self.getSelectedField(existingData, filteredFields);
                    if(!selectedField)
                    {
                        def.reject(DefaultNodeShapes.Localization.Conditions.FieldWasDeleted);
                        return;
                    }

                    var conditionText = self.getObjectTitle(fieldObject) + "(\"" + selectedField.name + "\") " + existingData.operator + " ";
                    var isNumberField = selectedField.fieldType == GoNorth.FlexFieldDatabase.ObjectForm.FlexFieldTypeNumber;
                    var emptyValue = "0";
                    if(!isNumberField)
                    {
                        conditionText += "\"";
                        emptyValue = "";
                    }
                    conditionText += existingData.compareValue ? existingData.compareValue : emptyValue;
                    if(!isNumberField)
                    {
                        conditionText += "\"";
                    }

                    def.resolve(conditionText);
                }, function() {
                    def.reject();
                });

                return def.promise();
            };

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking the player value
            var conditionTypeCheckPlayerValue = 2;

            /**
             * Check player value condition
             * @class
             */
            Conditions.CheckPlayerValueCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.CheckValueCondition.apply(this);
            };

            Conditions.CheckPlayerValueCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.CheckValueCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckPlayerValueCondition.prototype.getType = function() {
                return conditionTypeCheckPlayerValue;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckPlayerValueCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckPlayerValueLabel;
            };

            /**
             * Returns the title of the field object used in the string representation
             * 
             * @param {object} loadedFieldObject Loaded Field object for returning name if necessary
             * @returns {string} Title of the field object
             */
            Conditions.CheckPlayerValueCondition.prototype.getObjectTitle = function(loadedFieldObject) {
                return DefaultNodeShapes.Localization.Conditions.PlayerLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Conditions.CheckPlayerValueCondition.prototype.getObjectTypeName = function() {
                return "Npc";
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckPlayerValueCondition.prototype.getObjectId = function() {
                return "PlayerNpc";
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckPlayerValueCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the npc
             * 
             * @returns {jQuery.Deferred} Deferred for the async process
             */
            Conditions.CheckPlayerValueCondition.prototype.loadObject = function() {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/KortistoApi/PlayerNpc", 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };


            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckPlayerValueCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking the npc value
            var conditionTypeCheckNpcValue = 3;

            /**
             * Check npc value condition
             * @class
             */
            Conditions.CheckNpcValueCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.CheckValueCondition.apply(this);
            };

            Conditions.CheckNpcValueCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.CheckValueCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckNpcValueCondition.prototype.getType = function() {
                return conditionTypeCheckNpcValue;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckNpcValueCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckNpcValueLabel;
            };

            /**
             * Returns the title of the field object used in the string representation
             * 
             * @param {object} loadedFieldObject Loaded Field object for returning name if necessary
             * @returns {string} Title of the field object
             */
            Conditions.CheckNpcValueCondition.prototype.getObjectTitle = function(loadedFieldObject) {
                return DefaultNodeShapes.Localization.Conditions.NpcLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Conditions.CheckNpcValueCondition.prototype.getObjectTypeName = function() {
                return "Npc";
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckNpcValueCondition.prototype.getObjectId = function() {
                return DefaultNodeShapes.getCurrentRelatedObjectId();
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckNpcValueCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Loads the npc
             * 
             * @returns {jQuery.Deferred} Deferred for the async process
             */
            Conditions.CheckNpcValueCondition.prototype.loadObject = function() {
                var def = new jQuery.Deferred();
                
                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + DefaultNodeShapes.getCurrentRelatedObjectId(), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };


            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckNpcValueCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking the alive state of a npc to choose
            var conditionTypeCheckNpcAliveState = 9;


            /// Npc state alive
            var npcStateAlive = 0;

            /// Npc state dead
            var npcStateDead = 1;

            /// Npc state label lookup
            var npcStateLabelLookup = { };
            npcStateLabelLookup[npcStateAlive] = DefaultNodeShapes.Localization.Conditions.NpcAliveStateAlive;
            npcStateLabelLookup[npcStateDead] = DefaultNodeShapes.Localization.Conditions.NpcAliveStateDead;


            /**
             * Check npc alive state condition
             * @class
             */
            Conditions.CheckNpcAliveStateCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Conditions.CheckNpcAliveStateCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);
            Conditions.CheckNpcAliveStateCondition.prototype = jQuery.extend(Conditions.CheckNpcAliveStateCondition.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckNpcAliveStateCondition.prototype.getTemplateName = function() {
                return "gn-nodeNpcAliveStateCheck";
            };
            
            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckNpcAliveStateCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckNpcAliveStateCondition.prototype.getType = function() {
                return conditionTypeCheckNpcAliveState;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckNpcAliveStateCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckNpcAliveStateLabel;
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckNpcAliveStateCondition.prototype.getConditionDependsOnObject = function(existingData) {
                if(!existingData.npcId)
                {
                    return [];
                }

                return [{
                    objectType: Conditions.RelatedToObjectNpc,
                    objectId: existingData.npcId
                }];
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckNpcAliveStateCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Returns the object id from existing condition data for request caching
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id for caching
             */
            Conditions.CheckNpcAliveStateCondition.prototype.getObjectId = function(existingData) {
                return existingData.npcId;
            };

            /**
             * Loads an npc
             * 
             * @param {string} npcId Npc Id
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckNpcAliveStateCondition.prototype.loadObject = function(npcId) {
                var loadingDef = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + npcId, 
                    type: "GET"
                }).done(function(npc) {
                    loadingDef.resolve(npc);
                }).fail(function(xhr) {
                    loadingDef.reject();
                });

                return loadingDef;
            };

            /**
             * Creates a npc alive state object
             * 
             * @param {number} npcState Alive State of the npc
             * @returns {object} Npc Alive State object
             */
            Conditions.CheckNpcAliveStateCondition.prototype.createState = function(npcState)
            {
                return {
                    npcState: npcState,
                    label: npcStateLabelLookup[npcState]
                };
            };
            
            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckNpcAliveStateCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = {
                    selectedNpcId: new ko.observable(),
                    selectedNpcName: new ko.observable(DefaultNodeShapes.Localization.Conditions.ChooseNpcLabel),
                    selectedNpcState: new ko.observable(),
                    npcStates: [ 
                        this.createState(npcStateAlive),
                        this.createState(npcStateDead)
                    ]
                };

                conditionData.chooseNpc = function() {
                    GoNorth.DefaultNodeShapes.openNpcSearchDialog().then(function(npc) {
                        conditionData.selectedNpcId(npc.id);
                        conditionData.selectedNpcName(npc.name);
                    });
                };

                // Load existing data
                if(existingData)
                {
                    conditionData.selectedNpcId(existingData.npcId);
                    conditionData.selectedNpcState(existingData.state);

                    if(existingData.npcId) 
                    {
                        this.loadObjectShared(existingData).then(function(npc) {
                            conditionData.selectedNpcName(npc.name);
                        }, function() {
                            element.errorOccured(true);
                        });
                    }
                }

                return conditionData;
            };

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckNpcAliveStateCondition.prototype.serializeConditionData = function(conditionData) {
                return {
                    npcId: conditionData.selectedNpcId(),
                    state: conditionData.selectedNpcState()
                };
            };

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialzied condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckNpcAliveStateCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                
                // Check if data is valid
                if(!existingData.npcId)
                {
                    def.resolve(DefaultNodeShapes.Localization.Conditions.MissingInformations);
                    return def.promise();
                }

                // Load data and build string
                var self = this;
                this.loadObjectShared(existingData).then(function(npc) {
                    var conditionText = DefaultNodeShapes.Localization.Conditions.StateLabel + "(" + npc.name + ") = " + npcStateLabelLookup[existingData.state];

                    def.resolve(conditionText);
                }, function() {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckNpcAliveStateCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Operator for the has at least operation
            var inventoryOperatorHasAtLeast = 0;

            /// Operator for the has at maximum operation
            var inventoryOperatorHasAtMaximum = 1;

            /**
             * Check inventory condition
             * @class
             */
            Conditions.CheckInventoryCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
            };

            Conditions.CheckInventoryCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckInventoryCondition.prototype.getTemplateName = function() {
                return "gn-nodeConditionInventoryCheck";
            };
            
            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckInventoryCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Returns the name of an item
             * 
             * @param {string} itemId Id of the item
             * @returns {jQuery.Deferred} Deferred for the loading proccess
             */
            Conditions.CheckInventoryCondition.prototype.getItemName = function(itemId) {
                var def = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/StyrApi/ResolveFlexFieldObjectNames", 
                    headers: GoNorth.Util.generateAntiForgeryHeader(),
                    data: JSON.stringify([ itemId ]), 
                    type: "POST",
                    contentType: "application/json"
                }).done(function(itemNames) {
                    if(itemNames.length == 0)
                    {
                        def.reject();
                        return;
                    }

                    def.resolve(itemNames[0].name);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckInventoryCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = {
                    selectedItemId: new ko.observable(),
                    selectedItemName: new ko.observable(DefaultNodeShapes.Localization.Conditions.ChooseItem),
                    operator: new ko.observable(),
                    availableOperators: [ { value: inventoryOperatorHasAtLeast, title: DefaultNodeShapes.Localization.Conditions.ItemOperatorHasAtLeast }, { value: inventoryOperatorHasAtMaximum, title: DefaultNodeShapes.Localization.Conditions.ItemOperatorHasMaximum }],
                    quantity: new ko.observable(0)
                };

                if(existingData)
                {
                    conditionData.selectedItemId(existingData.itemId);
                    conditionData.operator(existingData.operator);
                    conditionData.quantity(existingData.quantity);

                    this.getItemName(existingData.itemId).then(function(name) {
                        conditionData.selectedItemName(name);
                    }, function() {
                        element.errorOccured(true);
                    });
                }

                conditionData.chooseItem = function() {
                    GoNorth.DefaultNodeShapes.openItemSearchDialog().then(function(item) {
                        conditionData.selectedItemId(item.id);
                        conditionData.selectedItemName(item.name);
                    });
                };
                
                return conditionData;
            };
            
            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckInventoryCondition.prototype.serializeConditionData = function(conditionData) {
                var quantity = parseInt(conditionData.quantity());
                if(isNaN(quantity))
                {
                    quantity = 0;
                }

                return {
                    itemId: conditionData.selectedItemId(),
                    operator: conditionData.operator(),
                    quantity: quantity
                };
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckInventoryCondition.prototype.getConditionDependsOnObject = function(existingData) {
                return [{
                    objectType: Conditions.RelatedToObjectItem,
                    objectId: existingData.itemId
                }];
            }

            /**
             * Returns the title of the inventory
             * 
             * @returns {string} Title of the inventory
             */
            Conditions.CheckInventoryCondition.prototype.getInventoryTitle = function() {
                
            };

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialzied condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckInventoryCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                if(!existingData.itemId)
                {
                    def.resolve(DefaultNodeShapes.Localization.Conditions.ChooseItem);
                    return def.promise();
                }

                var self = this;
                this.getItemName(existingData.itemId).then(function(name) {
                    var conditionString = self.getInventoryTitle() + " " + DefaultNodeShapes.Localization.Conditions.ItemCount + "(\"" + name + "\") ";
                    if(existingData.operator == inventoryOperatorHasAtLeast)
                    {
                        conditionString += ">=";
                    }
                    else if(existingData.operator == inventoryOperatorHasAtMaximum)
                    {
                        conditionString += "<=";
                    }
                    conditionString += " " + existingData.quantity;

                    def.resolve(conditionString);
                }, function() {
                    def.reject();
                });

                return def.promise();
            }

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking the player inventory
            var conditionTypeCheckPlayerInventory = 4;

            /**
             * Check player inventory condition
             * @class
             */
            Conditions.CheckPlayerInventoryCondition = function()
            {
                Conditions.CheckInventoryCondition.apply(this);
            };

            Conditions.CheckPlayerInventoryCondition.prototype = jQuery.extend({ }, Conditions.CheckInventoryCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckPlayerInventoryCondition.prototype.getType = function() {
                return conditionTypeCheckPlayerInventory;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckPlayerInventoryCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckPlayerInventoryLabel;
            };

            /**
             * Returns the title of the inventory
             * 
             * @returns {string} Title of the inventory
             */
            Conditions.CheckPlayerInventoryCondition.prototype.getInventoryTitle = function() {
                return DefaultNodeShapes.Localization.Conditions.PlayerInventoryLabel;
            };


            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckPlayerInventoryCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking the npc inventory
            var conditionTypeCheckNpcInventory = 5;

            /**
             * Check npc inventory condition
             * @class
             */
            Conditions.CheckNpcInventoryCondition = function()
            {
                Conditions.CheckInventoryCondition.apply(this);
            };

            Conditions.CheckNpcInventoryCondition.prototype = jQuery.extend({ }, Conditions.CheckInventoryCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckNpcInventoryCondition.prototype.getType = function() {
                return conditionTypeCheckNpcInventory;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckNpcInventoryCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckNpcInventoryLabel;
            };

            /**
             * Returns the title of the inventory
             * 
             * @returns {string} Title of the inventory
             */
            Conditions.CheckNpcInventoryCondition.prototype.getInventoryTitle = function() {
                return DefaultNodeShapes.Localization.Conditions.NpcInventoryLabel;
            };


            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckNpcInventoryCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /**
             * Check current quest value condition
             * @class
             */
            Conditions.CheckChooseObjectValueCondition = function()
            {
                DefaultNodeShapes.Conditions.CheckValueCondition.apply(this);
            };

            Conditions.CheckChooseObjectValueCondition.prototype = jQuery.extend({ }, DefaultNodeShapes.Conditions.CheckValueCondition.prototype);

            /**
             * Opens the object search dialog
             * 
             * @returns {jQuery.Deferred} Deferred for the choosing process
             */
            Conditions.CheckChooseObjectValueCondition.prototype.openObjectSearchDialog = function() {

            };

            /**
             * Returns the label used if no object name is selected to prompt the user to choose an object
             * 
             * @returns {string} Label used if no object name is selected to prompt the user to choose an object
             */
            Conditions.CheckChooseObjectValueCondition.prototype.getChooseObjectLabel = function() {

            };

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckChooseObjectValueCondition.prototype.getTemplateName = function() {
                return "gn-nodeConditionChooseObjectValueCheck";
            };

            /**
             * Returns true if the field object can be loaded, else false
             * 
             * @param {object} existingData Existing data
             * @returns {bool} true if the object can be loaded, else false
             */
            Conditions.CheckChooseObjectValueCondition.prototype.canLoadFieldObject = function(existingData) {
                return existingData && existingData.selectedObjectId;
            }

            /**
             * Function to allow additional object condition data to be processed after loading
             * 
             * @param {object} conditionData Condition data build by calling buildConditionData before
             * @param {object} loadedObject Loaded object
             */
            Conditions.CheckChooseObjectValueCondition.prototype.processAditionalLoadedObjectConditionData = function(conditionData, loadedObject) {
                conditionData.selectedObjectName(loadedObject.name);                
            };

            /**
             * Returns the object id for dependency checks
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id on which the condition depends
             */
            Conditions.CheckChooseObjectValueCondition.prototype.getDependsOnObjectId = function(existingData) {
                return this.getObjectId(existingData);
            };

            /**
             * Returns the object id from existing condition data for request caching
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id for caching
             */
            Conditions.CheckChooseObjectValueCondition.prototype.getObjectId = function(existingData) {
                return existingData.selectedObjectId;
            };

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckChooseObjectValueCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = Conditions.CheckValueCondition.prototype.buildConditionDataNoLoad.apply(this, [existingData, element]);

                conditionData.selectedObjectId = new ko.observable("");
                conditionData.selectedObjectName = new ko.observable(this.getChooseObjectLabel());

                if(existingData)
                {
                    conditionData.selectedObjectId(existingData.selectedObjectId);
                }

                var self = this;
                conditionData.chooseObject = function() {
                    self.openObjectSearchDialog().then(function(chosenObject) {
                        conditionData.selectedObjectId(chosenObject.id);
                        conditionData.selectedObjectName(chosenObject.name);

                        var updatedExistingData = self.serializeConditionData(conditionData);
                        self.loadAndParseFields(conditionData, updatedExistingData, element);
                    });
                };

                // Load field data
                if(this.canLoadFieldObject(existingData))
                {
                    this.loadAndParseFields(conditionData, existingData, element);
                }

                return conditionData;
            };

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckChooseObjectValueCondition.prototype.serializeConditionData = function(conditionData) {
                var serializedData = Conditions.CheckValueCondition.prototype.serializeConditionData.apply(this, [conditionData]);
                
                serializedData.selectedObjectId = conditionData.selectedObjectId();

                return serializedData;
            };

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking value of a quest to choose
            var conditionTypeCheckChooseQuestValue = 7;

            /**
             * Check quest value condition where quest is chosen
             * @class
             */
            Conditions.CheckChooseQuestValueCondition = function()
            {
                DefaultNodeShapes.Conditions.CheckChooseObjectValueCondition.apply(this);
            };

            Conditions.CheckChooseQuestValueCondition.prototype = jQuery.extend({ }, DefaultNodeShapes.Conditions.CheckChooseObjectValueCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckChooseQuestValueCondition.prototype.getType = function() {
                return conditionTypeCheckChooseQuestValue;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckChooseQuestValueCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckChooseQuestValueLabel;
            };

            /**
             * Returns the title of the field object used in the string representation
             * 
             * @param {object} loadedFieldObject Loaded Field object for returning name if necessary
             * @returns {string} Title of the field object
             */
            Conditions.CheckChooseQuestValueCondition.prototype.getObjectTitle = function(loadedFieldObject) {
                return loadedFieldObject.name;
            };

            /**
             * Opens the object search dialog
             * 
             * @returns {jQuery.Deferred} Deferred for the choosing process
             */
            Conditions.CheckChooseQuestValueCondition.prototype.openObjectSearchDialog = function() {
                return GoNorth.DefaultNodeShapes.openQuestSearchDialog();
            };

            
            /**
             * Returns the label used if no object name is selected to prompt the user to choose an object
             * 
             * @returns {string} Label used if no object name is selected to prompt the user to choose an object
             */
            Conditions.CheckChooseQuestValueCondition.prototype.getChooseObjectLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.ChooseQuestLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Conditions.CheckChooseQuestValueCondition.prototype.getObjectTypeName = function() {
                return Conditions.RelatedToObjectQuest;
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckChooseQuestValueCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceQuest;
            };

            /**
             * Loads the quest
             * 
             * @param {object} objectId Optional object id
             * @returns {jQuery.Deferred} Deferred for the async process
             */
            Conditions.CheckChooseQuestValueCondition.prototype.loadObject = function(objectId) {
                var def = new jQuery.Deferred();
                
                jQuery.ajax({ 
                    url: "/api/AikaApi/GetQuest?id=" + objectId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckChooseQuestValueCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking the state of a quest to choose
            var conditionTypeCheckChooseQuestState = 8;
            
            /**
             * Check quest state condition
             * @class
             */
            Conditions.CheckQuestStateCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Conditions.CheckQuestStateCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);
            Conditions.CheckQuestStateCondition.prototype = jQuery.extend(Conditions.CheckQuestStateCondition.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckQuestStateCondition.prototype.getTemplateName = function() {
                return "gn-nodeQuestStateCheck";
            };
            
            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckQuestStateCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckQuestStateCondition.prototype.getType = function() {
                return conditionTypeCheckChooseQuestState;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckQuestStateCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckQuestStateLabel;
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckQuestStateCondition.prototype.getConditionDependsOnObject = function(existingData) {
                if(!existingData.questId)
                {
                    return [];
                }

                return [{
                    objectType: Conditions.RelatedToObjectQuest,
                    objectId: existingData.questId
                }];
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckQuestStateCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceQuest;
            };

            /**
             * Returns the object id from existing condition data for request caching
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id for caching
             */
            Conditions.CheckQuestStateCondition.prototype.getObjectId = function(existingData) {
                return existingData.questId;
            };

            /**
             * Loads a quest
             * 
             * @param {string} questId Quest Id
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckQuestStateCondition.prototype.loadObject = function(questId) {
                var loadingDef = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/AikaApi/GetQuest?id=" + questId, 
                    type: "GET"
                }).done(function(quest) {
                    loadingDef.resolve(quest);
                }).fail(function(xhr) {
                    loadingDef.reject();
                });

                return loadingDef;
            };
            
            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckQuestStateCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = {
                    selectedQuestId: new ko.observable(),
                    selectedQuestName: new ko.observable(DefaultNodeShapes.Localization.Conditions.ChooseQuestLabel),
                    selectedQuestState: new ko.observable(),
                    questStates: DefaultNodeShapes.Shapes.getQuestStates()
                };

                conditionData.chooseQuest = function() {
                    GoNorth.DefaultNodeShapes.openQuestSearchDialog().then(function(quest) {
                        conditionData.selectedQuestId(quest.id);
                        conditionData.selectedQuestName(quest.name);
                    });
                };

                // Load existing data
                if(existingData)
                {
                    conditionData.selectedQuestId(existingData.questId);
                    conditionData.selectedQuestState(existingData.state)

                    if(existingData.questId) 
                    {
                        this.loadObjectShared(existingData).then(function(quest) {
                            conditionData.selectedQuestName(quest.name);
                        }, function() {
                            element.errorOccured(true);
                        });
                    }
                }

                return conditionData;
            };

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckQuestStateCondition.prototype.serializeConditionData = function(conditionData) {
                return {
                    questId: conditionData.selectedQuestId(),
                    state: conditionData.selectedQuestState()
                };
            };

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialzied condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckQuestStateCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                
                // Check if data is valid
                if(!existingData.questId)
                {
                    def.resolve(DefaultNodeShapes.Localization.Conditions.MissingInformations);
                    return def.promise();
                }

                // Load data and build string
                var self = this;
                this.loadObjectShared(existingData).then(function(quest) {
                    var conditionText = DefaultNodeShapes.Localization.Conditions.StateLabel + "(" + quest.name + ") = " + DefaultNodeShapes.Shapes.getQuestStateLabel(existingData.state);

                    def.resolve(conditionText);
                }, function() {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckQuestStateCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking the game time
            var conditionTypeCheckGameTime = 12;

            /// Game time Operator before
            var gameTimeOperatorBefore = 0;

            /// Game time Operator after
            var gameTimeOperatorAfter = 1;

            /// Game time operator label lookup
            var gameTimeOperatorLabelLookup = { };
            gameTimeOperatorLabelLookup[gameTimeOperatorBefore] = DefaultNodeShapes.Localization.Conditions.GameTimeOperatorBefore;
            gameTimeOperatorLabelLookup[gameTimeOperatorAfter] = DefaultNodeShapes.Localization.Conditions.GameTimeOperatorAfter;

            /**
             * Check game time condition
             * @class
             */
            Conditions.CheckGameTimeCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Conditions.CheckGameTimeCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);
            Conditions.CheckGameTimeCondition.prototype = jQuery.extend(Conditions.CheckGameTimeCondition.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckGameTimeCondition.prototype.getTemplateName = function() {
                return "gn-nodeGameTimeCheck";
            };
            
            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckGameTimeCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckGameTimeCondition.prototype.getType = function() {
                return conditionTypeCheckGameTime;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckGameTimeCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckGameTimeLabel;
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckGameTimeCondition.prototype.getConditionDependsOnObject = function(existingData) {
                return [];
            };

            /**
             * Returns the object resource
             * 
             * @returns {string} Object Id
             */
            Conditions.CheckGameTimeCondition.prototype.getObjectId = function() {
                return "ProjectMiscConfig";
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckGameTimeCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceProjectMiscConfig;
            };
            
            /**
             * Loads the project config
             * 
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckGameTimeCondition.prototype.loadObject = function() {
                var def = new jQuery.Deferred();
                
                jQuery.ajax({ 
                    url: "/api/ProjectConfigApi/GetMiscConfig", 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            /**
             * Creates a time operator object
             * 
             * @param {number} timeOperator Time operator
             * @returns {object} Time operator object
             */
            Conditions.CheckGameTimeCondition.prototype.createTimeOperator = function(timeOperator)
            {
                return {
                    operator: timeOperator,
                    label: gameTimeOperatorLabelLookup[timeOperator]
                };
            };

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckGameTimeCondition.prototype.buildConditionData = function(existingData, element) {
                var gameTimeMinutes = [];
                for(var curMinute = 0; curMinute < 60; curMinute += 5)
                {
                    gameTimeMinutes.push(curMinute);
                }
                gameTimeMinutes.push(59);

                var conditionData = {
                    selectedGameTimeOperator: new ko.observable(),
                    selectedGameTime: new ko.observable(GoNorth.BindingHandlers.buildTimeObject(0, 0)),
                    gameTimeOperators: [
                        this.createTimeOperator(gameTimeOperatorBefore),
                        this.createTimeOperator(gameTimeOperatorAfter)
                    ],
                    hoursPerDay: new ko.observable(24),
                    minutesPerHour: new ko.observable(60)
                };

                // Load config
                this.loadObjectShared({}).done(function(miscConfig) {
                    conditionData.hoursPerDay(miscConfig.hoursPerDay);
                    conditionData.minutesPerHour(miscConfig.minutesPerHour);
                }).fail(function() {
                    element.errorOccured(true);
                })

                // Load existing data
                if(existingData)
                {
                    conditionData.selectedGameTimeOperator(existingData.operator);
                    conditionData.selectedGameTime(GoNorth.BindingHandlers.buildTimeObject(existingData.hour, existingData.minutes));
                }

                return conditionData;
            };

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckGameTimeCondition.prototype.serializeConditionData = function(conditionData) {
                return {
                    operator: conditionData.selectedGameTimeOperator(),
                    hour: conditionData.selectedGameTime().hours,
                    minutes: conditionData.selectedGameTime().minutes
                };
            };

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialzied condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckGameTimeCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                
                var conditionString = DefaultNodeShapes.Localization.Conditions.GameTime;
                conditionString += " " + gameTimeOperatorLabelLookup[existingData.operator];
                conditionString += " " + this.formatTwoDigits(existingData.hour) + ":" + this.formatTwoDigits(existingData.minutes);
                def.resolve(conditionString);

                return def.promise();
            };

            /**
             * Formats a value as a two digit number
             * 
             * @param {number} number Number to format
             * @returns {string} Number as two digit
             */
            Conditions.CheckGameTimeCondition.prototype.formatTwoDigits = function(number) {
                if(!number) {
                    return "00";
                }

                var numberFormated = number.toString();
                if(numberFormated.length < 2)
                {
                    numberFormated = "0" + numberFormated;
                }

                return numberFormated;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckGameTimeCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /**
             * Check skill value condition where skill is chosen
             * @class
             */
            Conditions.CheckChooseSkillValueCondition = function()
            {
                DefaultNodeShapes.Conditions.CheckChooseObjectValueCondition.apply(this);
            };

            Conditions.CheckChooseSkillValueCondition.prototype = jQuery.extend({ }, DefaultNodeShapes.Conditions.CheckChooseObjectValueCondition.prototype);

            /**
             * Returns the skill prefix
             * 
             * @returns {string} Skill Prefix
             */
            Conditions.CheckChooseSkillValueCondition.prototype.getSkillPrefix = function() {
                return "";
            };

            /**
             * Returns the title of the field object used in the string representation
             * 
             * @param {object} loadedFieldObject Loaded Field object for returning name if necessary
             * @returns {string} Title of the field object
             */
            Conditions.CheckChooseSkillValueCondition.prototype.getObjectTitle = function(loadedFieldObject) {
                return this.getSkillPrefix() + loadedFieldObject.name;
            };

            /**
             * Opens the object search dialog
             * 
             * @returns {jQuery.Deferred} Deferred for the choosing process
             */
            Conditions.CheckChooseSkillValueCondition.prototype.openObjectSearchDialog = function() {
                return GoNorth.DefaultNodeShapes.openSkillSearchDialog();
            };

            
            /**
             * Returns the label used if no object name is selected to prompt the user to choose an object
             * 
             * @returns {string} Label used if no object name is selected to prompt the user to choose an object
             */
            Conditions.CheckChooseSkillValueCondition.prototype.getChooseObjectLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.ChooseSkillLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Conditions.CheckChooseSkillValueCondition.prototype.getObjectTypeName = function() {
                return Conditions.RelatedToObjectSkill;
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckChooseSkillValueCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceSkill;
            };

            /**
             * Loads the skill
             * 
             * @param {object} objectId Optional object id
             * @returns {jQuery.Deferred} Deferred for the async process
             */
            Conditions.CheckChooseSkillValueCondition.prototype.loadObject = function(objectId) {
                var def = new jQuery.Deferred();
                
                jQuery.ajax({ 
                    url: "/api/EvneApi/FlexFieldObject?id=" + objectId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking value of a skill to choose
            var conditionTypeCheckChoosePlayerSkillValue = 13;

            /**
             * Check player skill value condition where skill is chosen
             * @class
             */
            Conditions.CheckChoosePlayerSkillValueCondition = function()
            {
                DefaultNodeShapes.Conditions.CheckChooseSkillValueCondition.apply(this);
            };

            Conditions.CheckChoosePlayerSkillValueCondition.prototype = jQuery.extend({ }, DefaultNodeShapes.Conditions.CheckChooseSkillValueCondition.prototype);

            /**
             * Returns the skill prefix
             * 
             * @returns {string} Skill Prefix
             */
            Conditions.CheckChoosePlayerSkillValueCondition.prototype.getSkillPrefix = function() {
                return DefaultNodeShapes.Localization.Conditions.PlayerSkillPrefix;
            };

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckChoosePlayerSkillValueCondition.prototype.getType = function() {
                return conditionTypeCheckChoosePlayerSkillValue;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckChoosePlayerSkillValueCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckChoosePlayerSkillValueLabel;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckChoosePlayerSkillValueCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking value of a skill to choose
            var conditionTypeCheckChooseNpcSkillValue = 14;

            /**
             * Check npc skill value condition where skill is chosen
             * @class
             */
            Conditions.CheckChooseNpcSkillValueCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.CheckChooseSkillValueCondition.apply(this);
            };

            Conditions.CheckChooseNpcSkillValueCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.CheckChooseSkillValueCondition.prototype);

            /**
             * Returns the skill prefix
             * 
             * @returns {string} Skill Prefix
             */
            Conditions.CheckChooseNpcSkillValueCondition.prototype.getSkillPrefix = function() {
                return DefaultNodeShapes.Localization.Conditions.NpcSkillPrefix;
            };

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckChooseNpcSkillValueCondition.prototype.getType = function() {
                return conditionTypeCheckChooseNpcSkillValue;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckChooseNpcSkillValueCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckChooseNpcSkillValueLabel;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckChooseNpcSkillValueCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /**
             * Checks if a skill is learned or not
             * @class
             */
            Conditions.CheckLearnedSkillCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Conditions.CheckLearnedSkillCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);
            Conditions.CheckLearnedSkillCondition.prototype = jQuery.extend(Conditions.CheckLearnedSkillCondition.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckLearnedSkillCondition.prototype.getTemplateName = function() {
                return "gn-nodeConditionChooseSkillCheck";
            };

            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckLearnedSkillCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Returns the object id for dependency checks
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id on which the condition depends
             */
            Conditions.CheckLearnedSkillCondition.prototype.getDependsOnObjectId = function(existingData) {
                return this.getObjectId(existingData);
            };

            /**
             * Returns the object id from existing condition data for request caching
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id for caching
             */
            Conditions.CheckLearnedSkillCondition.prototype.getObjectId = function(existingData) {
                return existingData.selectedSkillId;
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckLearnedSkillCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceSkill;
            };

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckLearnedSkillCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = {
                    selectedSkillId: new ko.observable(""),
                    selectedSkillName: new ko.observable(DefaultNodeShapes.Localization.Conditions.ChooseSkillLabel)
                }

                if(existingData)
                {
                    conditionData.selectedSkillId(existingData.selectedSkillId);
                }

                var self = this;
                conditionData.chooseSkill = function() {
                    GoNorth.DefaultNodeShapes.openSkillSearchDialog().then(function(chosenSkill) {
                        conditionData.selectedSkillId(chosenSkill.id);
                        conditionData.selectedSkillName(chosenSkill.name);
                    });
                };

                // Load field data
                if(existingData && existingData.selectedSkillId)
                {
                    this.loadObjectShared(existingData).then(function(skill) {
                        conditionData.selectedSkillName(skill.name);
                    }).fail(function(xhr) {
                        element.errorOccured(true);
                    });
                }

                return conditionData;
            };

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckLearnedSkillCondition.prototype.serializeConditionData = function(conditionData) {
                var serializedData = {
                    selectedSkillId: conditionData.selectedSkillId()
                };

                return serializedData;
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckLearnedSkillCondition.prototype.getConditionDependsOnObject = function(existingData) {
                if(!existingData || !existingData.selectedSkillId)
                {
                    return [];
                }

                return [{
                    objectType: Conditions.RelatedToObjectSkill,
                    objectId: existingData.selectedSkillId
                }];
            }

            /**
             * Loads the skill
             * 
             * @param {object} objectId Optional object id
             * @returns {jQuery.Deferred} Deferred for the async process
             */
            Conditions.CheckLearnedSkillCondition.prototype.loadObject = function(objectId) {
                var def = new jQuery.Deferred();
                
                jQuery.ajax({ 
                    url: "/api/EvneApi/FlexFieldObject?id=" + objectId, 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            /**
             * Returns the condition string prefix infront of the skill name
             * 
             * @returns {string} Condition String prefix
             */
            Conditions.CheckLearnedSkillCondition.prototype.getConditionStringPrefix = function() {
                return "";
            }

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialized condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckLearnedSkillCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                
                // Check if data is valid
                if(!existingData || !existingData.selectedSkillId)
                {
                    def.resolve(DefaultNodeShapes.Localization.Conditions.MissingInformations);
                    return def.promise();
                }

                // Load data and build string
                var self = this;
                this.loadObjectShared(existingData).then(function(skill) {
                    var conditionText = self.getConditionStringPrefix() + skill.name;                    
                    def.resolve(conditionText);
                }, function() {
                    def.reject();
                });

                return def.promise();
            };

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking if the player has learned a skill
            var conditionTypeCheckSkillPlayerLearned = 15;

            /**
             * Check if player has learned a skill
             * @class
             */
            Conditions.CheckPlayerLearnedSkillCondition = function()
            {
                DefaultNodeShapes.Conditions.CheckLearnedSkillCondition.apply(this);
            };

            Conditions.CheckPlayerLearnedSkillCondition.prototype = jQuery.extend({ }, DefaultNodeShapes.Conditions.CheckLearnedSkillCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckPlayerLearnedSkillCondition.prototype.getType = function() {
                return conditionTypeCheckSkillPlayerLearned;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckPlayerLearnedSkillCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckPlayerLearnedSkillLabel;
            };

            /**
             * Returns the condition string prefix infront of the skill name
             * 
             * @returns {string} Condition String prefix
             */
            Conditions.CheckPlayerLearnedSkillCondition.prototype.getConditionStringPrefix = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckPlayerLearnedSkillPrefixLabel;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckPlayerLearnedSkillCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking if the player has not learned a skill
            var conditionTypeCheckSkillPlayerNotLearned = 16;

            /**
             * Check if player has not learned a skill
             * @class
             */
            Conditions.CheckPlayerNotLearnedSkillCondition = function()
            {
                DefaultNodeShapes.Conditions.CheckLearnedSkillCondition.apply(this);
            };

            Conditions.CheckPlayerNotLearnedSkillCondition.prototype = jQuery.extend({ }, DefaultNodeShapes.Conditions.CheckLearnedSkillCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckPlayerNotLearnedSkillCondition.prototype.getType = function() {
                return conditionTypeCheckSkillPlayerNotLearned;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckPlayerNotLearnedSkillCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckPlayerNotLearnedSkillLabel;
            };

            /**
             * Returns the condition string prefix infront of the skill name
             * 
             * @returns {string} Condition String prefix
             */
            Conditions.CheckPlayerNotLearnedSkillCondition.prototype.getConditionStringPrefix = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckPlayerNotLearnedSkillPrefixLabel;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckPlayerNotLearnedSkillCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking if the npc has learned a skill
            var conditionTypeCheckSkillNpcLearned = 17;

            /**
             * Check if npc has learned a skill
             * @class
             */
            Conditions.CheckNpcLearnedSkillCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.CheckLearnedSkillCondition.apply(this);
            };

            Conditions.CheckNpcLearnedSkillCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.CheckLearnedSkillCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckNpcLearnedSkillCondition.prototype.getType = function() {
                return conditionTypeCheckSkillNpcLearned;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckNpcLearnedSkillCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckNpcLearnedSkillLabel;
            };

            /**
             * Returns the condition string prefix infront of the skill name
             * 
             * @returns {string} Condition String prefix
             */
            Conditions.CheckNpcLearnedSkillCondition.prototype.getConditionStringPrefix = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckNpcLearnedSkillPrefixLabel;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckNpcLearnedSkillCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking if the npc has not learned a skill
            var conditionTypeCheckSkillNpcNotLearned = 18;

            /**
             * Check if npc has not learned a skill
             * @class
             */
            Conditions.CheckNpcNotLearnedSkillCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.CheckLearnedSkillCondition.apply(this);
            };

            Conditions.CheckNpcNotLearnedSkillCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.CheckLearnedSkillCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckNpcNotLearnedSkillCondition.prototype.getType = function() {
                return conditionTypeCheckSkillNpcNotLearned;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckNpcNotLearnedSkillCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckNpcNotLearnedSkillLabel;
            };

            /**
             * Returns the condition string prefix infront of the skill name
             * 
             * @returns {string} Condition String prefix
             */
            Conditions.CheckNpcNotLearnedSkillCondition.prototype.getConditionStringPrefix = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckNpcNotLearnedSkillPrefixLabel;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckNpcNotLearnedSkillCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking a random game value
            var conditionTypeCheckRandomValue = 19;

            /**
             * Check random value condition
             * @class
             */
            Conditions.CheckRandomValueCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
            };

            Conditions.CheckRandomValueCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckRandomValueCondition.prototype.getTemplateName = function() {
                return "gn-nodeCheckRandomValue";
            };
            
            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckRandomValueCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckRandomValueCondition.prototype.getType = function() {
                return conditionTypeCheckRandomValue;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckRandomValueCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckRandomValueLabel;
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckRandomValueCondition.prototype.getConditionDependsOnObject = function(existingData) {
                return [];
            };

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckRandomValueCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = {
                    selectedOperator: new ko.observable(),
                    minValue: new ko.observable(),
                    maxValue: new ko.observable(),
                    compareValue: new ko.observable(),
                    availableOperators: [ "=", "!=", "<=", "<", ">=", ">" ]
                };

                // Load existing data
                if(existingData)
                {
                    conditionData.selectedOperator(existingData.operator);
                    conditionData.minValue(existingData.minValue);
                    conditionData.maxValue(existingData.maxValue);
                    conditionData.compareValue(existingData.compareValue);
                }

                return conditionData;
            };

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckRandomValueCondition.prototype.serializeConditionData = function(conditionData) {
                return {
                    operator: conditionData.selectedOperator(),
                    minValue: conditionData.minValue() ? conditionData.minValue() : 0,
                    maxValue: conditionData.maxValue() ? conditionData.maxValue() : 0,
                    compareValue: conditionData.compareValue() ? conditionData.compareValue() : 0
                };
            };

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialzied condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckRandomValueCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                
                var conditionString = DefaultNodeShapes.Localization.Conditions.Rand;
                conditionString += "(" + existingData.minValue + "," + existingData.maxValue + ")";
                conditionString += " " + existingData.operator + " " + existingData.compareValue;
                def.resolve(conditionString);

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckRandomValueCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /**
             * Check value condition
             * @class
             */
            Conditions.CheckDailyRoutineEventStateCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
                GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.apply(this);
            };

            Conditions.CheckDailyRoutineEventStateCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);
            Conditions.CheckDailyRoutineEventStateCondition.prototype = jQuery.extend(Conditions.CheckDailyRoutineEventStateCondition.prototype, GoNorth.DefaultNodeShapes.Shapes.SharedObjectLoading.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.getTemplateName = function() {
                return "gn-nodeConditionCheckDailyRoutineEventState";
            };
            
            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = {
                    selectedDailyRoutineNpcId: new ko.observable(null),
                    selectedDailyRoutineEventId: new ko.observable(null),
                    selectedDailyRoutineNpcName: new ko.observable(null),
                    selectedDailyRoutineEvent: new ko.observable(null),
                };

                conditionData.selectedDailyRoutineEventDisplay = new ko.pureComputed(function() {
                    var npcName = this.selectedDailyRoutineNpcName();
                    var event = this.selectedDailyRoutineEvent();
                    if(!event) {
                        return DefaultNodeShapes.Localization.Conditions.ChooseDailyRoutineEvent;
                    }

                    var eventName = GoNorth.DailyRoutines.Util.formatTimeSpan(DefaultNodeShapes.Localization.Conditions.TimeFormat, event.earliestTime, event.latestTime);
                    return npcName + ": " + eventName;
                }, conditionData);

                // Handler
                conditionData.chooseDailyRoutineEvent = function() {
                    GoNorth.DefaultNodeShapes.openDailyRoutineEventSearchDialog().then(function(dailyRoutine) {
                        conditionData.selectedDailyRoutineNpcId(dailyRoutine.parentObject.id);
                        conditionData.selectedDailyRoutineEventId(dailyRoutine.eventId);
                        conditionData.selectedDailyRoutineNpcName(dailyRoutine.parentObject.name);
                        conditionData.selectedDailyRoutineEvent(dailyRoutine);
                    });
                };

                // Deserialize
                if(existingData)
                {
                    this.deserializeConditionData(conditionData, existingData);
                }

                return conditionData;
            };
            
            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.serializeConditionData = function(conditionData) {
                return {
                    npcId: conditionData.selectedDailyRoutineNpcId(),
                    eventId: conditionData.selectedDailyRoutineEventId()
                };
            };

            /**
             * Deserializes condition data
             * 
             * @param {object} conditionData Condition data
             * @param {object} existingData Existing condition data
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.deserializeConditionData = function(conditionData, existingData) {
                if(!existingData || !existingData.npcId || !existingData.eventId)
                {
                    return;
                }

                
                this.loadObjectShared(existingData).then(function(npc) {
                    if(!npc.dailyRoutine) 
                    {
                        return;
                    }

                    for(var curEvent = 0; curEvent < npc.dailyRoutine.length; ++curEvent)
                    {
                        if(npc.dailyRoutine[curEvent].eventId == existingData.eventId)
                        {
                            conditionData.selectedDailyRoutineNpcName(npc.name);
                            conditionData.selectedDailyRoutineEvent(npc.dailyRoutine[curEvent]);
                            return;
                        }
                    }
                });
            };

            /**
             * Returns the object id for dependency checks
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id on which the condition depends
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.getDependsOnObjectId = function(existingData) {
                return existingData && existingData.npcId ? existingData.npcId : null;
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.getConditionDependsOnObject = function(existingData) {
                var objectId = this.getDependsOnObjectId(existingData);

                return [{
                    objectType: "Npc",
                    objectId: objectId
                },{
                    objectType: "NpcDailyRoutineEvent",
                    objectId: existingData && existingData.eventId
                }];
            }


            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceNpc;
            };

            /**
             * Returns the object id from existing condition data for request caching
             * 
             * @param {object} existingData Existing condition data
             * @returns {string} Object Id for caching
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.getObjectId = function(existingData) {
                return existingData.npcId;
            };

            /**
             * Loads an npc
             * 
             * @param {string} npcId Npc Id
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.loadObject = function(npcId) {
                var loadingDef = new jQuery.Deferred();

                jQuery.ajax({ 
                    url: "/api/KortistoApi/FlexFieldObject?id=" + npcId, 
                    type: "GET"
                }).done(function(npc) {
                    loadingDef.resolve(npc);
                }).fail(function(xhr) {
                    loadingDef.reject();
                });

                return loadingDef;
            };

            /**
             * Returns the condition string text template
             * 
             * @returns {string} Condition string text template
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.getConditionStringText = function() {
                return "";
            };

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialized condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckDailyRoutineEventStateCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                
                // Check if data is valid
                if(!existingData || !existingData.npcId || !existingData.eventId)
                {
                    def.resolve(DefaultNodeShapes.Localization.Conditions.MissingInformations);
                    return def.promise();
                }

                // Load data and build string
                var self = this;
                this.loadObjectShared(existingData).then(function(npc) {
                    if(!npc.dailyRoutine) 
                    {
                        def.resolve(DefaultNodeShapes.Localization.Conditions.MissingInformations);
                        return;
                    }

                    for(var curEvent = 0; curEvent < npc.dailyRoutine.length; ++curEvent)
                    {
                        if(npc.dailyRoutine[curEvent].eventId == existingData.eventId)
                        {
                            var eventName = GoNorth.DailyRoutines.Util.formatTimeSpan(DefaultNodeShapes.Localization.Conditions.TimeFormat, npc.dailyRoutine[curEvent].earliestTime, npc.dailyRoutine[curEvent].latestTime);
                            var displayString = self.getConditionStringText().replace("{0}", npc.name + ": " + eventName)
                            def.resolve(displayString);
                            return;
                        }
                    }

                    def.resolve(DefaultNodeShapes.Localization.Conditions.MissingInformations);
                }, function() {
                    def.reject();
                });

                return def.promise();
            };

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking if a daily routine event is disabled
            var conditionTypeCheckDailyRoutineEventIsDisabled = 21;

            /**
             * Check if a daily routine event is disabled condition
             * @class
             */
            Conditions.CheckDailyRoutineEventIsDisabledCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.CheckDailyRoutineEventStateCondition.apply(this);
            };

            Conditions.CheckDailyRoutineEventIsDisabledCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.CheckDailyRoutineEventStateCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckDailyRoutineEventIsDisabledCondition.prototype.getType = function() {
                return conditionTypeCheckDailyRoutineEventIsDisabled;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckDailyRoutineEventIsDisabledCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckDailyRoutineIsDisabled;
            };
            
            /**
             * Returns the condition string text template
             * 
             * @returns {string} Condition string text template
             */
            Conditions.CheckDailyRoutineEventIsDisabledCondition.prototype.getConditionStringText = function() {
                return DefaultNodeShapes.Localization.Conditions.DailyRoutineEventIsDisabled;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckDailyRoutineEventIsDisabledCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for checking if a daily routine event is active
            var conditionTypeCheckDailyRoutineEventIsActive = 20;

            /**
             * Check if a daily routine event is active condition
             * @class
             */
            Conditions.CheckDailyRoutineEventIsActiveCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.CheckDailyRoutineEventStateCondition.apply(this);
            };

            Conditions.CheckDailyRoutineEventIsActiveCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.CheckDailyRoutineEventStateCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckDailyRoutineEventIsActiveCondition.prototype.getType = function() {
                return conditionTypeCheckDailyRoutineEventIsActive;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckDailyRoutineEventIsActiveCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckDailyRoutineIsActive;
            };
            
            /**
             * Returns the condition string text template
             * 
             * @returns {string} Condition string text template
             */
            Conditions.CheckDailyRoutineEventIsActiveCondition.prototype.getConditionStringText = function() {
                return DefaultNodeShapes.Localization.Conditions.DailyRoutineEventIsActive;
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckDailyRoutineEventIsActiveCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /// Condition Type for running a condition
            var conditionTypeCheckCodeCondition = 22;

            /**
             * Check code condition
             * @class
             */
            Conditions.CheckCodeCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.BaseCondition.apply(this);
            };

            Conditions.CheckCodeCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);

            /**
             * Returns the template name for the condition
             * 
             * @returns {string} Template name
             */
            Conditions.CheckCodeCondition.prototype.getTemplateName = function() {
                return "gn-nodeCheckCode";
            };
            
            /**
             * Returns true if the condition can be selected in the dropdown list, else false
             * 
             * @returns {bool} true if the condition can be selected, else false
             */
            Conditions.CheckCodeCondition.prototype.canBeSelected = function() {
                return true;
            };

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckCodeCondition.prototype.getType = function() {
                return conditionTypeCheckCodeCondition;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckCodeCondition.prototype.getLabel = function() {
                return DefaultNodeShapes.Localization.Conditions.CheckCodeLabel;
            };

            /**
             * Returns the objects on which an object depends
             * 
             * @param {object} existingData Existing condition data
             * @returns {object[]} Objects on which the condition depends
             */
            Conditions.CheckCodeCondition.prototype.getConditionDependsOnObject = function(existingData) {
                return [];
            };

            /**
             * Returns the data for the condition
             * 
             * @param {object} existingData Existing condition data
             * @param {object} element Element to which the data belongs
             * @returns {object} Condition data
             */
            Conditions.CheckCodeCondition.prototype.buildConditionData = function(existingData, element) {
                var conditionData = {
                    scriptName: new ko.observable(""),
                    scriptCode: new ko.observable("")                
                };

                var self = this;
                conditionData.editScript = function() {
                    self.editScript(conditionData);
                };

                // Load existing data
                if(existingData)
                {
                    conditionData.scriptName(existingData.scriptName);
                    conditionData.scriptCode(existingData.scriptCode);
                }

                return conditionData;
            };

            /**
             * Edits the condition script
             * 
             * @param {object} conditionData Condition data
             */
            Conditions.CheckCodeCondition.prototype.editScript = function(conditionData) {
                GoNorth.DefaultNodeShapes.openCodeEditor(conditionData.scriptName(), conditionData.scriptCode()).then(function(result) {
                    conditionData.scriptName(result.name);
                    conditionData.scriptCode(result.code);
                });
            };

            /**
             * Serializes condition data
             * 
             * @param {object} conditionData Condition data
             * @returns {object} Serialized data
             */
            Conditions.CheckCodeCondition.prototype.serializeConditionData = function(conditionData) {
                return {
                    scriptName: conditionData.scriptName(),
                    scriptCode: conditionData.scriptCode()
                };
            };

            /**
             * Returns the condition data as a display string
             * 
             * @param {object} existingData Serialzied condition data
             * @returns {jQuery.Deferred} Deferred for the loading process
             */
            Conditions.CheckCodeCondition.prototype.getConditionString = function(existingData) {
                var def = new jQuery.Deferred();
                
                def.resolve(existingData.scriptName ? existingData.scriptName : DefaultNodeShapes.Localization.Conditions.CheckCodeConditionPlaceholderString);

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckCodeCondition());

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Shapes) {

            // Function needs to be set in view model to open condition dialog
            if(!DefaultNodeShapes.openConditionDialog)
            {
                DefaultNodeShapes.openConditionDialog = function() {
                    var def = new jQuery.Deferred();
                    def.reject("Not implemented");
                    return def.promise();
                }
            }

            /// Condition Type
            var conditionType = "default.Condition";
            
            /// Condition Target Array
            var conditionTargetArray = "condition";


            /// Condition node width
            var conditionWidth = 350;
            
            /// Min Condition Height
            var conditionMinHeight = 50;

            /// Height of condition item in pixel
            var conditionItemHeight = 66;

            /// Initial Offset of the port
            var conditionPortInitialOffset = 76;
            

            joint.shapes.default = joint.shapes.default || {};

            /**
             * Creates the condition shape
             * @returns {object} Condition shape
             */
            function createConditionShape() {
                var model = joint.shapes.devs.Model.extend(
                {
                    defaults: joint.util.deepSupplement
                    (
                        {
                            type: conditionType,
                            icon: "glyphicon-question-sign",
                            size: { width: conditionWidth, height: conditionMinHeight },
                            inPorts: ['input'],
                            outPorts: [],
                            attrs:
                            {
                                '.inPorts circle': { "magnet": "passive", "port-type": "input" },
                                '.outPorts circle': { "magnet": "true" }
                            },
                            conditions: [],
                            currentConditionId: 0
                        },
                        joint.shapes.default.Base.prototype.defaults
                    )
                });
                return model;
            }

            /**
             * Creates a condition view
             * @returns {object} Condition view
             */
            function createConditionView() {
                return joint.shapes.default.BaseView.extend(
                {
                    /**
                     * Template
                     */
                    template:
                    [
                        '<div class="node">',
                            '<span class="label"><i class="nodeIcon glyphicon"></i><span class="labelText"></span></span>',
                            '<span class="gn-nodeLoading" style="display: none"><i class="glyphicon glyphicon-refresh spinning"></i></span>',
                            '<span class="gn-nodeError text-danger" style="display: none" title="' + GoNorth.DefaultNodeShapes.Localization.ErrorOccured + '"><i class="glyphicon glyphicon-warning-sign"></i></span>',
                            '<button class="delete gn-nodeDeleteOnReadonly cornerButton" title="' + GoNorth.DefaultNodeShapes.Localization.DeleteNode + '" type="button">x</button>',
                            '<button class="gn-nodeAddCondition gn-nodeDeleteOnReadonly cornerButton" title="' + GoNorth.DefaultNodeShapes.Localization.Conditions.AddCondition + '" type="button">+</button>',
                        '</div>',
                    ].join(''),

                    /** 
                     * Additiona Callback Buttons 
                     */
                    additionalCallbackButtons: {
                        "gn-nodeAddCondition": function() {
                            this.addCondition();
                        }
                    },

                    /**
                     * Initializes the shape
                     */
                    initialize: function() {
                        _.bindAll(this, 'addCondition');
                        joint.shapes.default.BaseView.prototype.initialize.apply(this, arguments);

                        this.model.on('change:conditions', this.syncConditions, this);

                        if(this.model.get("conditions").length == 0)
                        {
                            this.addCondition();
                        }
                        else
                        {
                            this.syncConditions();
                        }
                    },

                    /**
                     * Adds a new condition
                     * 
                     * @param {object} existingCondition Existing condition to add, null to create new one
                     */
                    addCondition: function(existingCondition) {
                        var condition = existingCondition;
                        if(!condition)
                        {
                            condition = {
                                id: this.model.get("currentConditionId"),
                                conditionElements: []
                            };
                            this.model.set("currentConditionId", this.model.get("currentConditionId") + 1);
                        }

                        // Copy conditions and update using set
                        var newConditions = (this.model.get("conditions") || {}).slice();
                        newConditions.push(condition);
                        this.model.set("conditions", newConditions);
                    },

                    /**
                     * Moves a condition
                     * 
                     * @param {number} conditionId Condition Id
                     * @param {number} direction Direction to move
                     */
                    moveCondition: function(conditionId, direction) {
                        var newConditions = (this.model.get("conditions") || {}).slice();
                        for(var curCondition = 0; curCondition < newConditions.length; ++curCondition)
                        {
                            if(newConditions[curCondition].id == conditionId)
                            {
                                var newIndex = curCondition + direction;
                                if(newIndex >= 0 && newIndex < newConditions.length)
                                {
                                    var tmpCondition = newConditions[curCondition];
                                    newConditions[curCondition] = newConditions[newIndex];
                                    newConditions[newIndex] = tmpCondition;
                                    this.model.set("conditions", newConditions);
                                }
                                return;
                            }
                        }
                    },

                    /**
                     * Delets a condition
                     * 
                     * @param {number} conditionId Condition Id
                     */
                    deleteCondition: function(conditionId) {
                        var newCondition = (this.model.get("conditions") || {}).slice();
                        for(var curCondition = 0; curCondition < newCondition.length; ++curCondition)
                        {
                            if(newCondition[curCondition].id == conditionId)
                            {
                                newCondition.splice(curCondition, 1);
                                this.model.set("conditions", newCondition);
                                return;
                            }
                        }
                    },


                    /** 
                     * Opens a condition
                     * 
                     * @param {number} conditionId Condition Id
                     */
                    openConditionDialog: function(conditionId) {
                        var conditions = (this.model.get("conditions") || {}).slice();
                        for(var curCondition = 0; curCondition < conditions.length; ++curCondition)
                        {
                            if(conditions[curCondition].id == conditionId)
                            {
                                var self = this;
                                DefaultNodeShapes.openConditionDialog(conditions[curCondition]).then(function() {
                                    self.syncConditions();
                                });
                                return;
                            }
                        }
                    },
                    
                    
                    /**
                     * Syncs the conditions (ports, size, ...)
                     */
                    syncConditions: function() {
                        var outPorts = [];
                        var conditions = this.model.get("conditions");
                        for(var curCondition = 0; curCondition < conditions.length; ++curCondition)
                        {
                            outPorts.push("condition" + conditions[curCondition].id);
                        }
                        outPorts.push("else");
                        this.model.set("outPorts", outPorts);

                        // Update Html
                        var allTextDeferreds = [];
                        var self = this;
                        
                        this.model.set("size", { width: conditionWidth, height: conditionMinHeight + outPorts.length * conditionItemHeight});
                        var conditionTable = "<table class='gn-nodeConditionTable'>";
                        jQuery.each(conditions, function(key, condition) {
                            var conditionText = self.buildConditionString(condition, allTextDeferreds);
                            conditionText = jQuery("<div></div>").text(conditionText).html();

                            conditionTable += "<tr>";
                            conditionTable += "<td class='gn-nodeConditionTableConditionCell'><a class='gn-clickable gn-nodeNonClickableOnReadonly' data-conditionid='" + condition.id + "'>" + conditionText + "</a></td>";
                            conditionTable += "<td class='gn-nodeDeleteOnReadonly'><i class='glyphicon glyphicon-arrow-up gn-nodeMoveConditionUp gn-nodeConditionIcon' data-conditionid='" + condition.id + "' title='" + DefaultNodeShapes.Localization.Conditions.MoveConditionUp + "'></i></td>";
                            conditionTable += "<td class='gn-nodeDeleteOnReadonly'><i class='glyphicon glyphicon-arrow-down gn-nodeMoveConditionDown gn-nodeConditionIcon' data-conditionid='" + condition.id + "' title='" + DefaultNodeShapes.Localization.Conditions.MoveConditionDown + "'></i></td>";
                            conditionTable += "<td class='gn-nodeDeleteOnReadonly'><i class='glyphicon glyphicon-trash gn-nodeDeleteCondition gn-nodeConditionIcon' data-conditionid='" + condition.id + "' title='" + DefaultNodeShapes.Localization.Conditions.DeleteCondition + "'></i></td>";
                            conditionTable += "</tr>";
                        });

                        conditionTable += "<tr>";
                        conditionTable += "<td class='gn-nodeConditionTableConditionCell'>" + DefaultNodeShapes.Localization.Conditions.Else + "</td>";
                        conditionTable += "</tr>";

                        conditionTable += "</table>";
                        if(this.$box.find(".gn-nodeConditionTable").length > 0)
                        {
                            this.$box.find(".gn-nodeConditionTable").replaceWith(conditionTable);
                        }
                        else
                        {
                            this.$box.append(conditionTable);
                        }

                        this.hideError();
                        if(allTextDeferreds.length > 0)
                        {
                            this.showLoading();
                            jQuery.when.apply(jQuery, allTextDeferreds).then(function() {
                                self.hideLoading();
                            }, function() {
                                self.hideLoading();
                                self.showError();
                            });
                        }

                        // Update Port Positions
                        for(var curCondition = 0; curCondition < outPorts.length; ++curCondition)
                        {
                            this.model.attr(".outPorts>.port" + curCondition, { "ref-y": (conditionPortInitialOffset + conditionItemHeight * curCondition) + "px", "ref": ".body" });
                        }

                        // Bind events
                        this.$box.find(".gn-nodeMoveConditionUp").on("click", function() {
                            self.moveCondition(jQuery(this).data("conditionid"), -1);
                        });

                        this.$box.find(".gn-nodeMoveConditionDown").on("click", function() {
                            self.moveCondition(jQuery(this).data("conditionid"), +1);
                        });

                        this.$box.find(".gn-nodeDeleteCondition").on("click", function() {
                            self.deleteCondition(jQuery(this).data("conditionid"));
                        });

                        this.$box.find(".gn-nodeConditionTableConditionCell a").on("click", function() {
                            self.openConditionDialog(jQuery(this).data("conditionid"));
                        });
                    },

                    /**
                     * Builds a condition string and sets it
                     * 
                     * @param {object} condition Condition
                     * @param {jQuery.Deferred[]} allTextDeferreds All Text Deferreds
                     * @returns {string} Condition text
                     */
                    buildConditionString: function(condition, allTextDeferreds) {
                        var conditionText = "";
                        var self = this;
                        if(condition.conditionElements && condition.conditionElements.length > 0)
                        {
                            conditionText = DefaultNodeShapes.Localization.Conditions.LoadingConditionText;

                            var selectorString = ".gn-nodeConditionTableConditionCell>a[data-conditionid='" + condition.id + "']";
                            var textDef = GoNorth.DefaultNodeShapes.Conditions.getConditionManager().getConditionString(condition.conditionElements, GoNorth.DefaultNodeShapes.Localization.Conditions.AndOperatorShort, false);
                            textDef.then(function(generatedText) {
                                if(!generatedText) 
                                {
                                    generatedText = DefaultNodeShapes.Localization.Conditions.EditCondition;
                                }
                                else 
                                { 
                                    self.$box.find(selectorString).attr("title", generatedText);
                                }
                                self.$box.find(selectorString).text(generatedText);
                                conditionText = generatedText;  // Update condition text in case no async operation was necessary
                            }, function(err) {
                                var errorText = DefaultNodeShapes.Localization.Conditions.ErrorLoadingConditionText;
                                if(err) 
                                {
                                    errorText += ": " + err;
                                }
                                self.$box.find(selectorString).text(errorText);
                                self.$box.find(selectorString).attr("title", errorText);
                                conditionText = errorText;
                            });
                            allTextDeferreds.push(textDef);
                        }
                        else
                        {
                            conditionText = DefaultNodeShapes.Localization.Conditions.EditCondition;
                        }

                        return conditionText;
                    },

                    /**
                     * Reloads the shared data
                     * 
                     * @param {number} objectType Object Type
                     * @param {string} objectId Object Id
                     */
                    reloadSharedLoadedData: function(objectType, objectId) {
                        var conditions = this.model.get("conditions");
                        var allTextDeferreds = [];
                        for(var curCondition = 0; curCondition < conditions.length; ++curCondition)
                        {
                            var dependsOnObject = GoNorth.DefaultNodeShapes.Conditions.getConditionManager().getConditionElementsDependsOnObject(conditions[curCondition].conditionElements);
                            for(var curDependency = 0; curDependency < dependsOnObject.length; ++curDependency)
                            {
                                if(dependsOnObject[curDependency].objectId == objectId)
                                {
                                    this.buildConditionString(conditions[curCondition], allTextDeferreds);
                                }
                            }
                        }

                        this.hideError();
                        if(allTextDeferreds.length > 0)
                        {
                            this.showLoading();
                            var self = this;
                            jQuery.when.apply(jQuery, allTextDeferreds).then(function() {
                                self.hideLoading();
                            }, function() {
                                self.hideLoading();
                                self.showError();
                            });
                        }
                    },


                    /**
                     * Shows the loading indicator
                     */
                    showLoading: function() {
                        this.$box.find(".gn-nodeLoading").show();
                    },

                    /**
                     * Hides the loading indicator
                     */
                    hideLoading: function() {
                        this.$box.find(".gn-nodeLoading").hide();
                    },


                    /**
                     * Shows the error indicator
                     */
                    showError: function() {
                        this.$box.find(".gn-nodeError").show();
                    },

                    /**
                     * Hides the error indicator
                     */
                    hideError: function() {
                        this.$box.find(".gn-nodeError").hide();
                    }
                });
            }

            /**
             * Condition Shape
             */
            joint.shapes.default.Condition = createConditionShape();

            /**
             * Condition View
             */
            joint.shapes.default.ConditionView = createConditionView();


            /** 
             * Condition Serializer 
             * 
             * @class
             */
            Shapes.ConditionSerializer = function()
            {
                GoNorth.DefaultNodeShapes.Serialize.BaseNodeSerializer.apply(this, [ joint.shapes.default.Condition, conditionType, conditionTargetArray ]);
            };

            Shapes.ConditionSerializer.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Serialize.BaseNodeSerializer.prototype)

            /**
             * Serializes a node
             * 
             * @param {object} node Node Object
             * @returns {object} Serialized NOde
             */
            Shapes.ConditionSerializer.prototype.serialize = function(node) {
                var serializedConditions = [];
                for(var curCondition = 0; curCondition < node.conditions.length; ++curCondition)
                {
                    var serializedCondition = GoNorth.DefaultNodeShapes.Conditions.getConditionManager().serializeCondition(node.conditions[curCondition]);
                    serializedConditions.push(serializedCondition);
                }

                var serializedData = {
                    id: node.id,
                    x: node.position.x,
                    y: node.position.y,
                    conditions: serializedConditions,
                    currentConditionId: node.currentConditionId
                };

                return serializedData;
            };

            /**
             * Deserializes a serialized node
             * 
             * @param {object} node Serialized Node Object
             * @returns {object} Deserialized Node
             */
            Shapes.ConditionSerializer.prototype.deserialize = function(node) {
                var deserializedConditions = [];
                for(var curCondition = 0; curCondition < node.conditions.length; ++curCondition)
                {
                    var deserializedCondition = GoNorth.DefaultNodeShapes.Conditions.getConditionManager().deserializeCondition(node.conditions[curCondition]);
                    deserializedConditions.push(deserializedCondition);
                }

                var initOptions = {
                    id: node.id,
                    position: { x: node.x, y: node.y },
                    conditions: deserializedConditions,
                    currentConditionId: node.currentConditionId
                };

                var node = new this.classType(initOptions);
                return node;
            };

            // Register Serializers
            var conditionSerializer = new Shapes.ConditionSerializer();
            GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance().addNodeSerializer(conditionSerializer);

        }(DefaultNodeShapes.Shapes = DefaultNodeShapes.Shapes || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Conditions) {

            /**
             * Finds the condition dialog in a parents list
             * @param {object[]} parents Knockout parents elements
             * @returns {object} Condition Dialog context
             */
            Conditions.findConditionDialog = function(parents) {
                for(var curParent = 0; curParent < parents.length; ++curParent)
                {
                    if(parents[curParent].isConditionDialogViewModel) {
                        return parents[curParent];
                    }
                }

                return parents[0];
            }

            /**
             * Condition Dialog Model
             * @class
             */
            Conditions.ConditionDialog = function()
            {
                this.isConditionDialogViewModel = true;

                this.isOpen = new ko.observable(false);
                this.condition = null;
                this.closingDeferred = null;

                this.conditionElements = new ko.observableArray();

                this.showGroupWarning = new ko.observable(false);
                this.showDragParentToChildWarning = new ko.observable(false);
                this.warningHideTimeout = null;
                
                this.selectableConditionTypes = Conditions.getConditionManager().getSelectableConditionTypes();
            };

            Conditions.ConditionDialog.prototype = {
                /**
                 * Shows the dialog
                 * 
                 * @param {object} condition Condition to edit
                 * @param {jQuery.Deferred} closingDeferred optional deferred that will be resolved on save
                 */
                openDialog: function(condition, closingDeferred) {
                    this.condition = condition;
                    this.closingDeferred = closingDeferred;
                    this.conditionElements(Conditions.getConditionManager().convertElements(condition.conditionElements));
                    if(this.conditionElements().length == 0)
                    {
                        this.addNewConditionElement();
                    }

                    this.isOpen(true);
                },

                /**
                 * Adds a new condition element
                 */
                addNewConditionElement: function() {
                    var element = Conditions.getConditionManager().createEmptyElement();

                    this.conditionElements.push(element);
                },

                /**
                 * Groups the selected elements as and
                 */
                andGroupElements: function() {
                    this.groupElements(Conditions.GroupConditionOperatorAnd);
                },
                
                /**
                 * Groups the selected elements as or
                 */
                orGroupElements: function() {
                    this.groupElements(Conditions.GroupConditionOperatorOr);
                },

                /**
                 * Groups the selected elements
                 * 
                 * @param {number} operator Operator for the element
                 */
                groupElements: function(operator) {
                    this.showGroupWarning(false);
                    
                    var selectedElements = [];
                    this.collectSelectedElements(selectedElements, this.conditionElements());
                    if(selectedElements.length < 2)
                    {
                        return;
                    }

                    for(var curElement = 1; curElement < selectedElements.length; ++curElement)
                    {
                        if(selectedElements[0].parent != selectedElements[curElement].parent)
                        {
                            this.displayWarning(this.showGroupWarning);
                            return;
                        }
                    }

                    // Group Elements
                    var groupData = {
                        conditionType: Conditions.GroupConditionType,
                        conditionData: {
                            fromDialog: true,
                            operator: operator,
                            conditionElements: selectedElements
                        }
                    };
                    var groupElement = Conditions.getConditionManager().convertElement(groupData);
                    groupElement.parent = selectedElements[0].parent;

                    // Push array
                    var targetArray = this.conditionElements;
                    if(selectedElements[0].parent)
                    {
                        targetArray = selectedElements[0].parent.conditionData().conditionElements;
                    }

                    var firstIndex = targetArray.indexOf(selectedElements[0]);
                    targetArray.removeAll(selectedElements);
                    if(firstIndex < targetArray().length)
                    {
                        targetArray.splice(firstIndex, 0, groupElement);
                    }
                    else
                    {
                        targetArray.push(groupElement);
                    }

                    // Set parent
                    for(var curElement = 0; curElement < selectedElements.length; ++curElement)
                    {
                        selectedElements[curElement].parent = groupElement;
                        selectedElements[curElement].isSelected(false);
                    }
                },

                /**
                 * Collects all selected elements
                 * 
                 * @param {object[]} targetArray Target array to fill
                 * @param {object[]} conditionElements Source array to search
                 */
                collectSelectedElements: function(targetArray, conditionElements) {
                    for(var curElement = 0; curElement < conditionElements.length; ++curElement)
                    {
                        if(conditionElements[curElement].isSelected())
                        {
                            targetArray.push(conditionElements[curElement]);
                        }

                        if(conditionElements[curElement].conditionData().conditionElements)
                        {
                            this.collectSelectedElements(targetArray, conditionElements[curElement].conditionData().conditionElements());
                        }
                    }
                },

                /**
                 * Moves a condition element up
                 * 
                 * @param {object} element Condition Element to move
                 */
                moveConditionElementUp: function(element) {
                    this.moveSingleConditionElement(element, -1);
                },

                /**
                 * Moves a condition element down
                 * 
                 * @param {object} element Condition Element to move
                 */
                moveConditionElementDown: function(element) {
                    this.moveSingleConditionElement(element, 1);
                },

                /**
                 * Moves a single condition element
                 * 
                 * @param {object} element Condition Element to move
                 * @param {number} direction Direction to move the element in
                 */
                moveSingleConditionElement: function(element, direction) {
                    var conditionElements = null;
                    if(element.parent)
                    {
                        conditionElements = element.parent.conditionData().conditionElements;
                    }
                    else
                    {
                        conditionElements = this.conditionElements;
                    }

                    var elementIndex = conditionElements.indexOf(element);
                    var newIndex = elementIndex + direction;
                    var unwrappedElements = conditionElements();
                    if(newIndex >= 0 && newIndex < unwrappedElements.length)
                    {
                        var tmp = unwrappedElements[elementIndex];
                        unwrappedElements[elementIndex] = unwrappedElements[newIndex];
                        unwrappedElements[newIndex] = tmp;
                        conditionElements.valueHasMutated();
                    }
                },

                /**
                 * Moves a condition to a group using drag and drop
                 */
                dropConditionToGroup: function(group, conditionElement) {
                    // Check data
                    if(conditionElement.parent == group)
                    {
                        return;
                    }

                    var parent = group ? group.parent : null;
                    while(parent != null)
                    {
                        if(parent == conditionElement)
                        {
                            this.displayWarning(this.showDragParentToChildWarning);
                            return;
                        }
                        parent = parent.parent;
                    }

                    // Remove from old array
                    if(!conditionElement.parent)
                    {
                        this.conditionElements.remove(conditionElement);
                    }
                    else
                    {
                        conditionElement.parent.conditionData().conditionElements.remove(conditionElement);
                        if(conditionElement.parent.conditionData().conditionElements().length < 2)
                        {
                            this.deleteConditionElement(conditionElement.parent);
                        }
                    }

                    if(!group)
                    {
                        this.conditionElements.push(conditionElement);
                    }
                    else
                    {
                        group.conditionData().conditionElements.push(conditionElement);
                    }

                    conditionElement.parent = group;
                },

                /**
                 * Displays a warning
                 * 
                 * @param {ko.observable} obs Observable to set to true to display the warning
                 */
                displayWarning: function(obs) {
                    if(this.warningHideTimeout)
                    {
                        clearTimeout(this.warningHideTimeout);
                        this.showGroupWarning(false);
                        this.showDragParentToChildWarning(false);
                    }

                    obs(true);
                    this.warningHideTimeout = setTimeout(function() {
                        obs(false);
                    }, 5000);
                },

                /**
                 * Deletes a condition element
                 * 
                 * @param {object} element Condition Element
                 */
                deleteConditionElement: function(element) {
                    if(element.conditionData().conditionElements)
                    {
                        var conditionElements = element.conditionData().conditionElements();
                        if(element.parent && element.parent.conditionData().conditionElements)
                        {
                            this.moveConditionElements(conditionElements, element.parent.conditionData().conditionElements, element.parent, element);
                        }
                        else
                        {
                            this.moveConditionElements(conditionElements, this.conditionElements, null, element);
                        }
                    }

                    if(!element.parent || !element.parent.conditionData().conditionElements)
                    {
                        this.conditionElements.remove(element);
                    }
                    else
                    {
                        element.parent.conditionData().conditionElements.remove(element);
                        if(element.parent.conditionData().conditionElements().length < 2)
                        {
                            this.deleteConditionElement(element.parent);
                        }
                    }
                },

                /**
                 * Moves the condition elements 
                 * 
                 * @param {object[]} conditionElements Condition elements to move
                 * @param {ko.observableArray} targetArray Target array to move the elements too
                 * @param {object} parent New parent
                 */
                moveConditionElements: function(conditionElements, targetArray, parent, element) {
                    // Move elements
                    var targetIndex = targetArray.indexOf(element);
                    for(var curElement = 0; curElement < conditionElements.length; ++curElement)
                    {
                        conditionElements[curElement].parent = parent;
                        if(targetIndex < targetArray().length)
                        {
                            targetArray.splice(targetIndex + curElement, 0, conditionElements[curElement]);
                        }
                        else
                        {
                            targetArray.push(conditionElements[curElement]);
                        }
                    }
                },

                /**
                 * Returns the condition template
                 * 
                 * @param {object} element Condition Element
                 * @returns {string} Condition Element template
                 */
                getConditionTemplate: function(element) {
                    if(element)
                    {
                        return Conditions.getConditionManager().getConditionTemplate(element.conditionType());
                    }

                    return "gn-nodeConditionEmpty";
                },

                /**
                 * Returns the condition template
                 * 
                 * @param {object} element Condition Element
                 * @returns {string} Condition Element template
                 */
                isConditionTypeSelectable: function(element) {
                    if(element)
                    {
                        return Conditions.getConditionManager().isConditionTypeSelectable(element.conditionType());
                    }

                    return true;
                },


                /**
                 * Saves the condition
                 */
                saveCondition: function() {
                    var serializedData = [];
                    var conditionElements = this.conditionElements();
                    for(var curElement = 0; curElement < conditionElements.length; ++curElement)
                    {
                        serializedData.push(Conditions.getConditionManager().serializeConditionElement(conditionElements[curElement]));
                    }
                    
                    this.condition.conditionElements = serializedData;
                    if(this.closingDeferred)
                    {
                        this.closingDeferred.resolve();
                    }
                    this.closeDialog();
                },

                /**
                 * Closes the dialog
                 */
                closeDialog: function() {
                    this.condition = null;
                    this.closingDeferred = null;
                    this.isOpen(false);
                }
            };

        }(DefaultNodeShapes.Conditions = DefaultNodeShapes.Conditions || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(Kortisto) {
        (function(Npc) {

            /**
             * Checks if an object exists in a flex field array
             * 
             * @param {ko.observableArray} searchArray Array to search
             * @param {object} objectToSearch Flex Field object to search
             */
            Npc.doesObjectExistInFlexFieldArray = function(searchArray, objectToSearch)
            {
                var searchObjects = searchArray();
                for(var curObject = 0; curObject < searchObjects.length; ++curObject)
                {
                    if(searchObjects[curObject].id == objectToSearch.id)
                    {
                        return true;
                    }
                }

                return false;
            }

        }(Kortisto.Npc = Kortisto.Npc || {}));
    }(GoNorth.Kortisto = GoNorth.Kortisto || {}));
}(window.GoNorth = window.GoNorth || {}));
(function (GoNorth) {
    "use strict";
    (function (Kortisto) {
        (function (Npc) {

            /**
             * Inventory Form
             * @param {GoNorth.ChooseObjectDialog.ViewModel} objectDialog Object dialog
             * @class
             */
            Npc.InventoryForm = function (objectDialog) {
                this.objectDialog = objectDialog;

                this.isInventoryExpanded = new ko.observable(false);
                this.inventoryItems = new ko.observableArray();
                this.itemToRemove = null;
                this.showConfirmRemoveDialog = new ko.observable(false);
                this.isLoadingInventory = new ko.observable(false);
                this.loadingInventoryError = new ko.observable(false);
            };

            Npc.InventoryForm.prototype = {
                /**
                 * Loads the inventory
                 * 
                 * @param {object[]} inventory Inventory to load
                 * @returns {jQuery.Deferred} Deferred for the loading
                 */
                loadInventory: function (inventory) {
                    var inventoryDef = new jQuery.Deferred();

                    var inventoryItemIds = [];
                    var itemLookup = {};
                    for (var curItem = 0; curItem < inventory.length; ++curItem) {
                        inventoryItemIds.push(inventory[curItem].itemId);
                        itemLookup[inventory[curItem].itemId] = inventory[curItem];
                    }

                    this.isLoadingInventory(true);
                    this.loadingInventoryError(false);
                    var self = this;
                    jQuery.ajax({
                        url: "/api/StyrApi/ResolveFlexFieldObjectNames",
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify(inventoryItemIds),
                        type: "POST",
                        contentType: "application/json"
                    }).done(function (itemNames) {
                        var loadedInventoryItems = [];
                        for (var curItem = 0; curItem < itemNames.length; ++curItem) {
                            loadedInventoryItems.push({
                                id: itemNames[curItem].id,
                                name: itemNames[curItem].name,
                                quantity: new ko.observable(itemLookup[itemNames[curItem].id].quantity),
                                isEquipped: new ko.observable(itemLookup[itemNames[curItem].id].isEquipped)
                            });
                        }

                        self.inventoryItems(loadedInventoryItems);
                        self.isLoadingInventory(false);

                        inventoryDef.resolve();
                    }).fail(function (xhr) {
                        self.inventoryItems([]);
                        self.isLoadingInventory(false);
                        self.loadingInventoryError(true);

                        inventoryDef.reject();
                    });

                    return inventoryDef.promise();
                },


                /**
                 * Toggles the inventory visibility
                 */
                toogleInventoryVisibility: function () {
                    this.isInventoryExpanded(!this.isInventoryExpanded());
                },

                /**
                 * Adds an item to the inventory
                 */
                addItemToInventory: function () {
                    var self = this;
                    this.objectDialog.openItemSearch(Npc.Localization.AddItemToInventory).then(function (item) {
                        if (Npc.doesObjectExistInFlexFieldArray(self.inventoryItems, item)) {
                            return;
                        }

                        self.inventoryItems.push({
                            id: item.id,
                            name: item.name,
                            quantity: new ko.observable(1),
                            isEquipped: new ko.observable(false)
                        });

                        self.inventoryItems.sort(function (item1, item2) {
                            return item1.name.localeCompare(item2.name);
                        });
                    });
                },

                /**
                 * Removes an item from the inventory
                 * 
                 * @param {object} item Item to remove
                 */
                openRemoveItemDialog: function (item) {
                    this.itemToRemove = item;
                    this.showConfirmRemoveDialog(true);
                },

                /**
                 * Removes the item which should be removed
                 */
                removeItem: function () {
                    if (this.itemToRemove) {
                        this.inventoryItems.remove(this.itemToRemove);
                    }

                    this.closeConfirmRemoveDialog();
                },

                /**
                 * Closes the confirm remove dialog
                 */
                closeConfirmRemoveDialog: function () {
                    this.itemToRemove = null;
                    this.skillToRemove = null;
                    this.showConfirmRemoveDialog(false);
                },

                /**
                 * Serializes the inventory
                 * 
                 * @returns {object[]} Serialized inventory
                 */
                serializeInventory: function () {
                    var inventory = [];
                    var inventoryItems = this.inventoryItems();
                    for (var curItem = 0; curItem < inventoryItems.length; ++curItem) {
                        var quantity = parseInt(inventoryItems[curItem].quantity());
                        if (isNaN(quantity)) {
                            quantity = 1;
                        }

                        var item = {
                            itemId: inventoryItems[curItem].id,
                            quantity: quantity,
                            isEquipped: inventoryItems[curItem].isEquipped(),
                        };
                        inventory.push(item);
                    }

                    return inventory;
                },
                
                /**
                 * Builds the url for an item
                 * 
                 * @param {object} item Item which should be opened
                 * @returns {string} Url for the item
                 */
                buildItemUrl: function(item) {
                    return "/Styr/Item?id=" + item.id;
                }
            };

        }(Kortisto.Npc = Kortisto.Npc || {}));
    }(GoNorth.Kortisto = GoNorth.Kortisto || {}));
}(window.GoNorth = window.GoNorth || {}));
(function (GoNorth) {
    "use strict";
    (function (Kortisto) {
        (function (Npc) {

            /**
             * Skill Form
             * @param {GoNorth.ChooseObjectDialog.ViewModel} objectDialog Object dialog
             * @class
             */
            Npc.SkillForm = function (objectDialog) {
                this.objectDialog = objectDialog;

                this.areSkillsExpanded = new ko.observable(false);
                this.learnedSkills = new ko.observableArray();
                this.skillToRemove = null;
                this.showConfirmRemoveDialog = new ko.observable(false);
                this.isLoadingSkills = new ko.observable(false);
                this.loadingSkillsError = new ko.observable(false);
            };

            Npc.SkillForm.prototype = {
                /**
                 * Loads the skills of the npc
                 * 
                 * @param {object[]} skills Skills of the npc
                 */
                loadSkills: function (skills) {
                    var skillDef = new jQuery.Deferred();

                    var learnedSkillIds = [];
                    for (var curSkill = 0; curSkill < skills.length; ++curSkill) {
                        learnedSkillIds.push(skills[curSkill].skillId);
                    }

                    this.isLoadingSkills(true);
                    this.loadingSkillsError(false);
                    var self = this;
                    jQuery.ajax({
                        url: "/api/EvneApi/ResolveFlexFieldObjectNames",
                        headers: GoNorth.Util.generateAntiForgeryHeader(),
                        data: JSON.stringify(learnedSkillIds),
                        type: "POST",
                        contentType: "application/json"
                    }).done(function (skillNames) {
                        var loadedSkills = [];
                        for (var curSkill = 0; curSkill < skillNames.length; ++curSkill) {
                            loadedSkills.push({
                                id: skillNames[curSkill].id,
                                name: skillNames[curSkill].name,
                            });
                        }

                        self.learnedSkills(loadedSkills);
                        self.isLoadingSkills(false);

                        skillDef.resolve();
                    }).fail(function (xhr) {
                        self.learnedSkills([]);
                        self.isLoadingSkills(false);
                        self.loadingSkillsError(true);

                        skillDef.reject();
                    });

                    return skillDef.promise();
                },

                /**
                 * Serializes the skills
                 * 
                 * @returns {object[]} Serialized skills
                 */
                serializeSkills: function () {
                    var skills = [];
                    var learnedSkills = this.learnedSkills();
                    for (var curSkill = 0; curSkill < learnedSkills.length; ++curSkill) {
                        var skill = {
                            skillId: learnedSkills[curSkill].id
                        };
                        skills.push(skill);
                    }

                    return skills;
                },

                /**
                 * Toggles the skill visibility
                 */
                toogleSkillVisibility: function () {
                    this.areSkillsExpanded(!this.areSkillsExpanded());
                },

                /**
                 * Opens a dialog to add a new skill
                 */
                addSkill: function () {
                    var self = this;
                    this.objectDialog.openSkillSearch(Npc.Localization.AddSkill).then(function (skill) {
                        if (Npc.doesObjectExistInFlexFieldArray(self.learnedSkills, skill)) {
                            return;
                        }

                        self.learnedSkills.push({
                            id: skill.id,
                            name: skill.name
                        });

                        self.learnedSkills.sort(function (skill1, skill2) {
                            return skill1.name.localeCompare(skill2.name);
                        });
                    });
                },

                /**
                 * Builds the url for a skill
                 * 
                 * @param {object} skill Skill which should be opened
                 * @returns {string} Url for the skill
                 */
                buildSkillUrl: function (skill) {
                    return "/Evne/Skill?id=" + skill.id;
                },

                /**
                 * Removes a skill
                 * 
                 * @param {object} skill Skill to remove
                 */
                openRemoveSkillDialog: function (skill) {
                    this.skillToRemove = skill;
                    this.showConfirmRemoveDialog(true);
                },

                /**
                 * Removes the object which should be removed
                 */
                removeSkill: function () {
                    if (this.skillToRemove) {
                        this.learnedSkills.remove(this.skillToRemove);
                    }

                    this.closeConfirmRemoveDialog();
                },

                /**
                 * Closes the confirm remove dialog
                 */
                closeConfirmRemoveDialog: function () {
                    this.skillToRemove = null;
                    this.showConfirmRemoveDialog(false);
                }
            };

        }(Kortisto.Npc = Kortisto.Npc || {}));
    }(GoNorth.Kortisto = GoNorth.Kortisto || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(Kortisto) {
        (function(Npc) {

            /**
             * Daily Routines Form
             * @param {ko.observable} id Id observable
             * @param {GoNorth.ChooseObjectDialog.ViewModel} objectDialog Object choose dialog
             * @param {ko.observableArray} markedInKartaMaps Array with karta maps in which the npc is marked
             * @param {ko.observable} errorOccured Error occured observable
             * @class
             */
            Npc.DailyRoutinesForm = function(id, objectDialog, markedInKartaMaps, errorOccured)
            {
                this.id = id;
                this.errorOccured = errorOccured;

                this.markedInKartaMaps = markedInKartaMaps;

                this.isDailyRoutineExpanded = new ko.observable(false);

                this.dailyRoutineEvents = new ko.observableArray();

                this.hoursPerDay = new ko.observable(24);
                this.minutesPerHour = new ko.observable(60);

                this.showAddEditEventDialog = new ko.observable(false);
                this.addEditEventEnabledByDefault = new ko.observable(true);
                this.addEditEventEarliestTime = new ko.observable(GoNorth.BindingHandlers.buildTimeObject(0, 0));
                this.addEditEventLatestTime = new ko.observable(GoNorth.BindingHandlers.buildTimeObject(0, 0));
                this.addEditEventTargetState = new ko.observable("");
                this.eventToEdit = new ko.observable(null);
                GoNorth.DailyRoutines.Util.keepTimeObservablesInOrder(this.addEditEventEarliestTime, this.addEditEventLatestTime);

                this.chooseScriptTypeDialog = new GoNorth.Shared.ChooseScriptTypeDialog.ViewModel();
                this.codeScriptDialog = new GoNorth.ScriptDialog.CodeScriptDialog(this.errorOccured);
                this.nodeScriptDialog = new GoNorth.ScriptDialog.NodeScriptDialog(this.id, objectDialog, this.codeScriptDialog, this.errorOccured);

                this.showConfirmRemoveEventDialog = new ko.observable(false);
                this.eventToRemove = null;

                this.showDisabledEvents = new ko.observable(true);

                this.showMovementTargetMissingMapMarkerWarning = new ko.observable(false);

                this.suggestedNpcStates = new ko.observableArray();

                this.timeEventsOverlap = new ko.pureComputed(function() {
                    return GoNorth.DailyRoutines.Util.doEventsOverlap(this.dailyRoutineEvents());
                }, this);

                this.loadConfig();
            };

            Npc.DailyRoutinesForm.prototype = {
                /**
                 * Loads the config
                 */
                loadConfig: function() {
                    var self = this;
                    jQuery.ajax("/api/ProjectConfigApi/GetMiscConfig").done(function(data) {
                        self.hoursPerDay(data.hoursPerDay);
                        self.minutesPerHour(data.minutesPerHour);
                    }).fail(function() {
                        self.errorOccured(true);
                    });

                    jQuery.ajax("/api/ProjectConfigApi/GetJsonConfigByKey?configKey=" + GoNorth.ProjectConfig.ConfigKeys.SetNpcStateAction).done(function(loadedConfigData) {
                        if(!loadedConfigData)
                        {
                            return;
                        }
                        
                        try
                        {
                            var configLines = JSON.parse(loadedConfigData)
                            self.suggestedNpcStates(configLines);
                        }
                        catch(e)
                        {
                            self.errorOccured(true);
                        }
                    }).fail(function() {
                        self.errorOccured(true);
                    });
                },

                /**
                 * Loads the events
                 * @param {object[]} dailyRoutine Daily routine
                 */
                loadEvents: function(dailyRoutine) {
                    this.dailyRoutineEvents.removeAll();
                    if(!dailyRoutine) {
                        return;
                    }

                    var newEvents = GoNorth.DailyRoutines.deserializeRoutineEventArray(dailyRoutine);
                    this.dailyRoutineEvents(newEvents);
                },

                /**
                 * Sets the event ids for new events
                 * @param {object[]} returnedDailyRoutine Daily routine data returned from the server
                 */
                setNewEventIds: function(returnedDailyRoutine) {
                    if(!returnedDailyRoutine) {
                        return;
                    }

                    var existingEvents = this.dailyRoutineEvents();
                    for(var curEvent = 0; curEvent < existingEvents.length; ++curEvent)
                    {
                        if(existingEvents[curEvent].eventId) {
                            continue;
                        }

                        for(var curReturnedEvent = 0; curReturnedEvent < returnedDailyRoutine.length; ++curReturnedEvent)
                        {
                            if(returnedDailyRoutine[curReturnedEvent].earliestTime && returnedDailyRoutine[curReturnedEvent].earliestTime.hours == existingEvents[curEvent].earliestTime().hours &&
                               returnedDailyRoutine[curReturnedEvent].latestTime && returnedDailyRoutine[curReturnedEvent].latestTime.hours == existingEvents[curEvent].latestTime().hours &&
                               returnedDailyRoutine[curReturnedEvent].eventType == existingEvents[curEvent].eventType && returnedDailyRoutine[curReturnedEvent].enabledByDefault == existingEvents[curEvent].enabledByDefault() &&
                               returnedDailyRoutine[curReturnedEvent].scriptName == existingEvents[curEvent].scriptName())
                            {
                                existingEvents[curEvent].eventId = returnedDailyRoutine[curReturnedEvent].eventId;
                                break;
                            }
                        }
                    }
                },

                
                /**
                 * Serializes the events
                 * @returns {object[]} Serialized events
                 */
                serializeEvents: function() {
                    var serializedEvents = [];

                    var events = this.dailyRoutineEvents();
                    for(var curEvent = 0; curEvent < events.length; ++curEvent)
                    {
                        serializedEvents.push(GoNorth.DailyRoutines.serializeRoutineEvent(events[curEvent]));
                    }

                    return serializedEvents;
                },


                /**
                 * Toggles the visibility of the daily routines section
                 */
                toogleDailyRoutinesVisibility: function() {
                    this.isDailyRoutineExpanded(!this.isDailyRoutineExpanded());
                },


                /**
                 * Opens Karta to add a new movement event
                 */
                addNewMovementEvent: function() {
                    var movementTargetMapId = "";
                    var hasMovementTargets = false;
                    var existingEvents = this.dailyRoutineEvents();
                    for(var curEvent = 0; curEvent < existingEvents.length; ++curEvent)
                    {
                        if(existingEvents[curEvent].movementTarget && existingEvents[curEvent].movementTarget.mapId) {
                            movementTargetMapId = existingEvents[curEvent].movementTarget.mapId;
                            hasMovementTargets = true;
                            break;
                        }
                    }

                    var kartaMaps = this.markedInKartaMaps();
                    var markerId = "";
                    var markerType = "";
                    if(!movementTargetMapId && kartaMaps.length > 0) {
                        movementTargetMapId = kartaMaps[0].mapId;
                        if(kartaMaps[0].markerIds.length == 1)
                        {
                            markerId = kartaMaps[0].markerIds[0];
                            markerType = kartaMaps[0].mapMarkerType;
                        }
                    }

                    if(movementTargetMapId) {
                        var url = "/Karta?id=" + encodeURIComponent(movementTargetMapId) + "&dailyRoutineNpcId=" + encodeURIComponent(this.id());
                        if(!hasMovementTargets && markerId && markerType) {
                            url += "&zoomOnMarkerId=" + encodeURIComponent(markerId) + "&zoomOnMarkerType=" + markerType;
                        }
                        window.location = url;
                    } else {
                        this.openMovementTargetMissingMapMarkerWarning();
                    }
                },

                /**
                 * Opens the dialog to warn the user that the npc is currently not marked in any map
                 */
                openMovementTargetMissingMapMarkerWarning: function() {
                    this.showMovementTargetMissingMapMarkerWarning(true);
                },

                /**
                 * Redirects the user to the map to add a daily routine even though no marker exists
                 */
                redirectToMapWithMissingMapMarker: function() {
                    window.location = "/Karta?dailyRoutineNpcId=" + encodeURIComponent(this.id()); 
                },

                /**
                 * Closes the dialog to warn the user that the npc is currently not marked in any map
                 */
                closeMovementTargetMissingMapMarkerWarning: function() {
                    this.showMovementTargetMissingMapMarkerWarning(false);
                },

                /**
                 * Opens the dialog to add a new script event
                 */
                addNewScriptEvent: function() {
                    this.openAddEventDialog();
                },

                /**
                 * Confirms the add/edit script event dialog
                 */
                confirmAddScriptEventDialog: function() {
                    var self = this;
                    this.showAddEditEventDialog(false);
                    this.chooseScriptTypeDialog.openDialog().done(function(selectedType) {
                        if(selectedType == GoNorth.Shared.ChooseScriptTypeDialog.nodeGraph)
                        {
                            self.nodeScriptDialog.openCreateDialog().done(function(result) {
                                self.createScriptEvent(GoNorth.DailyRoutines.ScriptTypes.nodeGraph, result.name, null, result.graph);
                            });
                        }
                        else if(selectedType == GoNorth.Shared.ChooseScriptTypeDialog.codeScript)
                        {
                            self.codeScriptDialog.openCreateDialog().done(function(result) {
                                self.createScriptEvent(GoNorth.DailyRoutines.ScriptTypes.codeScript, result.name, result.code, null);
                            });
                        }
                    });
                },

                /**
                 * Creates a new script event 
                 * @param {number} scriptType Script type
                 * @param {string} code Code of the event
                 * @param {object} nodeGraph Node Graph of the event
                 */
                createScriptEvent: function(scriptType, name, code, nodeGraph) {
                    var scriptEvent = GoNorth.DailyRoutines.createRoutineEvent(GoNorth.DailyRoutines.EventTypes.script, this.addEditEventEarliestTime(), this.addEditEventLatestTime(), null, "", 
                                                                               scriptType, name, nodeGraph, code, this.addEditEventEnabledByDefault());

                    this.dailyRoutineEvents.push(scriptEvent);
                    this.ensureDisabledEventsAreShownAfterEdit();
                },

                /**
                 * Confirms the edit of a script event
                 */
                confirmEditScriptEvent: function() {
                    if(!this.eventToEdit())
                    {
                        return;
                    }

                    this.eventToEdit().earliestTime(GoNorth.BindingHandlers.buildTimeObject(this.addEditEventEarliestTime().hours, this.addEditEventEarliestTime().minutes));
                    this.eventToEdit().latestTime(GoNorth.BindingHandlers.buildTimeObject(this.addEditEventLatestTime().hours, this.addEditEventLatestTime().minutes));
                    if(this.eventToEdit().eventType == GoNorth.DailyRoutines.EventTypes.movement)
                    {
                        this.eventToEdit().targetState(this.addEditEventTargetState());
                    }
                    this.eventToEdit().enabledByDefault(this.addEditEventEnabledByDefault());

                    this.ensureDisabledEventsAreShownAfterEdit();
                    this.closeAddEditEventDialog();
                },

                /**
                 * Ensures that disabled events are shown after an edit / create
                 */
                ensureDisabledEventsAreShownAfterEdit: function() {
                    if(!this.addEditEventEnabledByDefault() && !this.showDisabledEvents())
                    {
                        this.showDisabledEvents(true);
                    }
                },

                /**
                 * Opens the add event dialog
                 */
                openAddEventDialog: function() {
                    this.addEditEventEnabledByDefault(true);
                    this.addEditEventEarliestTime(GoNorth.BindingHandlers.buildTimeObject(0, 0));
                    this.addEditEventLatestTime(GoNorth.BindingHandlers.buildTimeObject(0, 0));
                    this.addEditEventTargetState("");
                    this.eventToEdit(null);
                    this.showAddEditEventDialog(true);
                },

                /**
                 * Opens the edit event dialog
                 * @param {object} eventObj Event object to edit
                 */
                openEditEventDialog: function(eventObj) {
                    this.addEditEventEnabledByDefault(eventObj.enabledByDefault());
                    this.addEditEventEarliestTime(GoNorth.BindingHandlers.buildTimeObject(eventObj.earliestTime().hours, eventObj.earliestTime().minutes));
                    this.addEditEventLatestTime(GoNorth.BindingHandlers.buildTimeObject(eventObj.latestTime().hours, eventObj.latestTime().minutes));
                    this.addEditEventTargetState(eventObj.targetState());
                    this.eventToEdit(eventObj);
                    this.showAddEditEventDialog(true);
                },

                /**
                 * Opens the edit event script dialog
                 * @param {object} eventObj Event object
                 */
                openEditEventScriptDialog: function(eventObj) {
                    if(eventObj.scriptType == GoNorth.DailyRoutines.ScriptTypes.nodeGraph)
                    {
                        this.nodeScriptDialog.openEditDialog(eventObj.scriptName(), eventObj.scriptNodeGraph).done(function(result) {
                            eventObj.scriptName(result.name);
                            eventObj.scriptNodeGraph = result.graph;
                        });
                    }
                    else if(eventObj.scriptType == GoNorth.DailyRoutines.ScriptTypes.codeScript)
                    {
                        this.codeScriptDialog.openEditDialog(eventObj.scriptName(), eventObj.scriptCode).done(function(result) {
                            eventObj.scriptName(result.name);
                            eventObj.scriptCode = result.code;
                        });
                    }
                },

                /**
                 * Closes the add/edit event dialog
                 */
                closeAddEditEventDialog: function() {
                    this.showAddEditEventDialog(false);
                },


                /**
                 * Opens the remove event dialog
                 * @param {object} eventObj Event object to remove
                 */
                openRemoveEventDialog: function(eventObj) {
                    this.showConfirmRemoveEventDialog(true);
                    this.eventToRemove = eventObj;
                },

                /**
                 * Removes the event to delete
                 */
                removeEvent: function() {
                    if(this.eventToRemove) {
                        this.dailyRoutineEvents.remove(this.eventToRemove);
                    }

                    this.closeConfirmRemoveEventDialog();
                },

                /**
                 * Closes the confirm remove event dialog
                 */
                closeConfirmRemoveEventDialog: function() {
                    this.showConfirmRemoveEventDialog(false);
                    this.eventToRemove = null;
                },


                /**
                 * Compare function for the daily routines array
                 * @param {object} event1 Daily routines event 1
                 * @param {object} event2 Daily routines event 2
                 * @returns {number} Compare value
                 */
                compareTimeEvents: function(event1, event2) {
                    var d1 = event1.earliestTime();
                    var d2 = event2.earliestTime();

                    return GoNorth.BindingHandlers.compareTimes(d1, d2);                    
                },


                /**
                 * Toggles the display of disabled events
                 */
                toogleShowDisabledEvents: function() {
                    this.showDisabledEvents(!this.showDisabledEvents());
                }
            };

        }(Kortisto.Npc = Kortisto.Npc || {}));
    }(GoNorth.Kortisto = GoNorth.Kortisto || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(Kortisto) {
        (function(Npc) {

            /**
             * Npc View Model
             * @class
             */
            Npc.ViewModel = function()
            {
                GoNorth.FlexFieldDatabase.ObjectForm.BaseViewModel.apply(this, [ "/Kortisto", "KortistoApi", "Npc", "KortistoNpc", "KortistoTemplate", "GetPagesByNpc?npcId=", "GetMapsByNpcId?npcId=" ]);

                this.showConfirmRemoveDialog = new ko.observable(false);

                this.objectDialog = new GoNorth.ChooseObjectDialog.ViewModel();
                this.inventoryForm = new Npc.InventoryForm(this.objectDialog);
                this.skillForm = new Npc.SkillForm(this.objectDialog);
                this.dailyRoutinesForm = new Npc.DailyRoutinesForm(this.id, this.objectDialog, this.markedInKartaMaps, this.errorOccured);

                this.isPlayerNpc = new ko.observable(false);

                this.showMarkAsPlayerDialog = new ko.observable(false);

                this.nameGenTemplate = new ko.observable("ss"); // Default Setting is very simple name
                this.nameGenDialogTemplate = new ko.observable("");
                this.showNameGenSettingsDialog = new ko.observable(false);
                this.nameGenSample = new ko.observable("");
                this.nameGenTemplateError = new ko.observable(false);
                this.nameGenTemplateErrorDescription = new ko.observable("");

                var self = this;
                this.nameGenDialogTemplate.subscribe(function() {
                    self.generateSampleNameGenName();
                });

                this.dialogExists = new ko.observable(false);
                this.dialogImplemented = new ko.observable(false);

                this.init();

                if(GoNorth.FlexFieldDatabase.ObjectForm.hasImplementationStatusTrackerRights && GoNorth.FlexFieldDatabase.ObjectForm.hasTaleRights && this.id())
                {
                    this.loadDialogImplementationState();
                }
            };

            Npc.ViewModel.prototype = jQuery.extend({ }, GoNorth.FlexFieldDatabase.ObjectForm.BaseViewModel.prototype);

            /**
             * Parses additional data from a loaded object
             * 
             * @param {object} data Data returned from the webservice
             */
            Npc.ViewModel.prototype.parseAdditionalData = function(data) {
                if(!this.isTemplateMode())
                {
                    this.isPlayerNpc(data.isPlayerNpc);
                }

                this.nameGenTemplate(data.nameGenTemplate ? data.nameGenTemplate : "");

                var self = this;
                if(Npc.hasStyrRights && data.inventory && data.inventory.length > 0)
                {
                    this.inventoryForm.loadInventory(data.inventory).done(function() {
                        self.saveLastObjectState();
                    });
                }

                if(Npc.hasEvneRights && data.skills && data.skills.length > 0)
                {
                    this.skillForm.loadSkills(data.skills).done(function() {
                        self.saveLastObjectState();
                    });
                }

                this.dailyRoutinesForm.loadEvents(data.dailyRoutine);
            };

            /**
             * Opens the compare dialog for the current object
             * 
             * @returns {jQuery.Deferred} Deferred which gets resolved after the object is marked as implemented
             */
            Npc.ViewModel.prototype.openCompareDialogForObject = function() {
                return this.compareDialog.openNpcCompare(this.id(), this.objectName());
            };

            /**
             * Loads the state of the dialog implementation state
             */
            Npc.ViewModel.prototype.loadDialogImplementationState = function() {
                var self = this;
                jQuery.ajax({ 
                    url: "/api/TaleApi/IsDialogImplementedByRelatedObjectId?relatedObjectId=" + this.id(), 
                    type: "GET"
                }).done(function(data) {
                    self.dialogExists(data.exists);
                    self.dialogImplemented(data.isImplemented);
                }).fail(function(xhr) {
                    self.errorOccured(true);
                });
            };

            /**
             * Sets Additional save data
             * 
             * @param {object} data Save data
             * @returns {object} Save data with additional values
             */
            Npc.ViewModel.prototype.setAdditionalSaveData = function(data) {
                data.isPlayerNpc = this.isPlayerNpc();
                data.nameGenTemplate = this.nameGenTemplate();
                data.inventory = this.inventoryForm.serializeInventory();
                data.skills = this.skillForm.serializeSkills();
                data.dailyRoutine = this.dailyRoutinesForm.serializeEvents();

                return data;
            };

            /**
             * Runs logic after save
             * 
             * @param {object} data Returned data after save
             */
            Npc.ViewModel.prototype.runAfterSave = function(data) {
                this.dailyRoutinesForm.setNewEventIds(data.dailyRoutine);
            };


            /**
             * Checks if an object exists in a flex field array
             * 
             * @param {ko.observableArray} searchArray Array to search
             * @param {object} objectToSearch Flex Field object to search
             */
            Npc.ViewModel.prototype.doesObjectExistInFlexFieldArray = function(searchArray, objectToSearch)
            {
                var searchObjects = searchArray();
                for(var curObject = 0; curObject < searchObjects.length; ++curObject)
                {
                    if(searchObjects[curObject].id == objectToSearch.id)
                    {
                        return true;
                    }
                }

                return false;
            }
            

            /**
             * Opens the tale dialog for the npc
             */
            Npc.ViewModel.prototype.openTale = function() {
                if(!this.id())
                {
                    return;
                }

                window.location = "/Tale?npcId=" + this.id();
            };


            /**
             * Opens the mark as playe dialog
             */
            Npc.ViewModel.prototype.openMarkAsPlayerDialog = function() {
                this.showMarkAsPlayerDialog(true);
            };

            /**
             * Closes the mark as player dialog
             */
            Npc.ViewModel.prototype.closeMarkAsPlayerDialog = function() {
                this.showMarkAsPlayerDialog(false);
            };

            /**
             * Marks the npc as a player
             */
            Npc.ViewModel.prototype.markAsPlayer = function() {
                this.isPlayerNpc(true);
                this.closeMarkAsPlayerDialog();
                this.save();
            };


            /**
             * Opens the name generator settings
             */
            Npc.ViewModel.prototype.openNameGenSettings = function() {
                this.showNameGenSettingsDialog(true);
                this.nameGenTemplateError(false);
                this.nameGenTemplateErrorDescription("");
                this.nameGenDialogTemplate(this.nameGenTemplate());
            };

            /**
             * Saves the name generator settings
             */
            Npc.ViewModel.prototype.saveNameGenSettings = function() {
                if(this.nameGenTemplateError())
                {
                    return;
                }

                this.nameGenTemplate(this.nameGenDialogTemplate());
                this.closeNameGenDialog();
            };

            /**
             * Generates a sample name for the name gen settings
             */
            Npc.ViewModel.prototype.generateSampleNameGenName = function() {
                this.nameGenTemplateError(false);
                this.nameGenTemplateErrorDescription("");
                if(!this.nameGenDialogTemplate())
                {
                    this.nameGenSample("");
                    return;
                }

                try
                {
                    this.nameGenSample(this.createRandomName(this.nameGenDialogTemplate()));
                }
                catch(e)
                {
                    this.nameGenSample("");
                    this.nameGenTemplateError(true);
                    switch(e.message)
                    {
                    case "MISSING_CLOSING_BRACKET":
                        this.nameGenTemplateErrorDescription(GoNorth.Kortisto.Npc.Localization.NameGenMissingClosingBracket)
                        break;
                    case "UNBALANCED_BRACKETS":
                        this.nameGenTemplateErrorDescription(GoNorth.Kortisto.Npc.Localization.NameGenUnbalancedBrackets)
                        break;
                    case "UNEXPECTED_<_IN_INPUT":
                        this.nameGenTemplateErrorDescription(GoNorth.Kortisto.Npc.Localization.NameGenUnexpectedPointyBracketInInput)
                        break;
                    case "UNEXPECTED_)_IN_INPUT":
                        this.nameGenTemplateErrorDescription(GoNorth.Kortisto.Npc.Localization.NameGenUnexpectedRoundBracketInInput)
                        break;
                    default:
                        this.nameGenTemplateErrorDescription(GoNorth.Kortisto.Npc.Localization.NameGenUnknownError)
                    }
                }
            };

            /**
             * Closes the name generator settings
             */
            Npc.ViewModel.prototype.closeNameGenDialog = function() {
                this.showNameGenSettingsDialog(false);
            };


            /**
             * Generates a new name for the npc
             */
            Npc.ViewModel.prototype.generateName = function() {
                this.objectName(this.createRandomName(this.nameGenTemplate()));
            };
            
            /**
             * Creates a random name
             * 
             * @returns {string} Random Name 
             */
            Npc.ViewModel.prototype.createRandomName = function(template) {
                var generator = NameGen.compile(template);
                var name = generator.toString();

                // Capitalize first letter
                if(name && name.length > 0)
                {
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }

                return name;
            };

        }(Kortisto.Npc = Kortisto.Npc || {}));
    }(GoNorth.Kortisto = GoNorth.Kortisto || {}));
}(window.GoNorth = window.GoNorth || {}));