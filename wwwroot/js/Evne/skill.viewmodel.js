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
             * @param {string} name Name of the object
             * @param {string} openLink Link to open the object
             */
            createDialogObject: function(id, name, openLink) {
                return {
                    id: id,
                    name: name,
                    openLink: openLink
                };
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
            }
            
        };

    }(GoNorth.ChooseObjectDialog = GoNorth.ChooseObjectDialog || {}));
}(window.GoNorth = window.GoNorth || {}));
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
                   (fields[curField].scriptSettings && fields[curField].scriptSettings.dontExportToScript))
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

                    // TODO: Check for field edit to ignore current ifeld
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
             * @param {string} lockName Name of the resource used for the lock for an object of this type
             * @param {string} templateLockName Name of the resource used for the lock for a template of this type
             * @param {string} kirjaApiMentionedMethod Method of the kirja api which is used to load the pages in which the object is mentioned
             * @param {string} kartaApiMentionedMethod Method of the karta api which is used to load the maps in which the object is mentioned
             * @class
             */
            ObjectForm.BaseViewModel = function(rootPage, apiControllerName, lockName, templateLockName, kirjaApiMentionedMethod, kartaApiMarkedMethod)
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

                this.errorOccured = new ko.observable(false);
                this.additionalErrorDetails = new ko.observable("");
                this.objectNotFound = new ko.observable(false);

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
                }).fail(function(xhr) {
                    self.isLoading(false);
                    self.errorOccured(true);
                });
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
                }).fail(function(xhr) {
                    self.isLoading(false);
                    self.errorOccured(true);
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
                    self.exportResultErrors(data.errors);
                }).fail(function(xhr) {
                    self.closeExportResultDialog();
                    self.errorOccured(true);
                    self.isLoading(false);
                });
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
                 * @returns {int} Object Resource
                 */
                getObjectResource: function() {

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
    
                    if(loadedObjects[this.getObjectResource()]) {
                        var existingObject = loadedObjects[this.getObjectResource()][objectId];
                        if(existingObject)
                        {
                            var def = new jQuery.Deferred();
                            def.resolve(existingObject);
                            return def.promise();
                        }
                    }
    
                    if(objectsLoadingDeferreds[this.getObjectResource()])
                    {
                        var existingDef = objectsLoadingDeferreds[this.getObjectResource()][objectId];
                        if(existingDef)
                        {
                            return existingDef;
                        }
                    }
    
                    var loadingDef = this.loadObject(objectId);
                    if(!objectsLoadingDeferreds[this.getObjectResource()])
                    {
                        objectsLoadingDeferreds[this.getObjectResource()] = {};
                    }

                    objectsLoadingDeferreds[this.getObjectResource()][objectId] = loadingDef;
    
                    var self = this;
                    loadingDef.then(function(object) {
                        if(!loadedObjects[self.getObjectResource()])
                        {
                            loadedObjects[self.getObjectResource()] = {};
                        }

                        loadedObjects[self.getObjectResource()][objectId] = object;
                    });
    
                    return loadingDef;
                },

                /**
                 * Loads and object
                 * 
                 * @param {string} objectId Optional Object Id extracted using getObjectId before
                 * @returns {jQuery.Deferred} Deferred for the loading process
                 */
                loadObject: function(objectId) {

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
    (function(Evne) {
        (function(Conditions) {

            /// Condition Type for checking the skill value
            var conditionTypeCheckSkillValue = 11;

            /**
             * Check skill value condition
             * @class
             */
            Conditions.CheckSkillValueCondition = function()
            {
                GoNorth.DefaultNodeShapes.Conditions.CheckValueCondition.apply(this);
            };

            Conditions.CheckSkillValueCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.CheckValueCondition.prototype);

            /**
             * Returns the type of the condition
             * 
             * @returns {number} Type of the condition
             */
            Conditions.CheckSkillValueCondition.prototype.getType = function() {
                return conditionTypeCheckSkillValue;
            };

            /**
             * Returns the label of the condition
             * 
             * @returns {string} Label of the condition
             */
            Conditions.CheckSkillValueCondition.prototype.getLabel = function() {
                return Evne.Localization.Conditions.CheckSkillValueLabel;
            };

            /**
             * Returns the title of the field object used in the string representation
             * 
             * @param {object} loadedFieldObject Loaded Field object for returning name if necessary
             * @returns {string} Title of the field object
             */
            Conditions.CheckSkillValueCondition.prototype.getObjectTitle = function(loadedFieldObject) {
                return Evne.Localization.Conditions.SkillLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Conditions.CheckSkillValueCondition.prototype.getObjectTypeName = function() {
                return "Skill";
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckSkillValueCondition.prototype.getObjectId = function() {
                return Evne.getCurrentSkillId();
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Conditions.CheckSkillValueCondition.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceSkill;
            };

            /**
             * Loads the skill
             * 
             * @returns {jQuery.Deferred} Deferred for the async process
             */
            Conditions.CheckSkillValueCondition.prototype.loadObject = function() {
                var def = new jQuery.Deferred();
                
                var self = this;
                jQuery.ajax({ 
                    url: "/api/EvneApi/FlexFieldObject?id=" + Evne.getCurrentSkillId(), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };


            GoNorth.DefaultNodeShapes.Conditions.getConditionManager().addConditionType(new Conditions.CheckSkillValueCondition());

        }(Evne.Conditions = Evne.Conditions || {}));
    }(GoNorth.Evne = GoNorth.Evne || {}));
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
            };

            Conditions.CheckGameTimeCondition.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Conditions.BaseCondition.prototype);

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
                var gameTimeHours = [];
                for(var curHour = 0; curHour < 24; ++curHour)
                {
                    gameTimeHours.push(curHour);
                }

                var gameTimeMinutes = [];
                for(var curMinute = 0; curMinute < 60; curMinute += 5)
                {
                    gameTimeMinutes.push(curMinute);
                }
                gameTimeMinutes.push(59);

                var conditionData = {
                    selectedGameTimeOperator: new ko.observable(),
                    selectedGameTimeHour: new ko.observable(),
                    selectedGameTimeMinutes: new ko.observable(),
                    gameTimeOperators: [
                        this.createTimeOperator(gameTimeOperatorBefore),
                        this.createTimeOperator(gameTimeOperatorAfter)
                    ],
                    gameTimeHours: gameTimeHours,
                    gameTimeMinutes: gameTimeMinutes
                };

                // Load existing data
                if(existingData)
                {
                    conditionData.selectedGameTimeOperator(existingData.operator);
                    conditionData.selectedGameTimeHour(existingData.hour);
                    conditionData.selectedGameTimeMinutes(existingData.minutes)
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
                    hour: conditionData.selectedGameTimeHour(),
                    minutes: conditionData.selectedGameTimeMinutes()
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
                            '<button class="delete gn-nodeDeleteOnReadonly cornerButton" title="' + GoNorth.DefaultNodeShapes.Localization.DeleteNode + '">x</button>',
                            '<button class="gn-nodeAddCondition gn-nodeDeleteOnReadonly cornerButton" title="' + GoNorth.DefaultNodeShapes.Localization.Conditions.AddCondition + '">+</button>',
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
             * Condition Dialog Model
             * @class
             */
            Conditions.ConditionDialog = function()
            {
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
    (function(DefaultNodeShapes) {
        (function(Shapes) {

            /// Action Type
            var actionType = "default.Action";
            
            /// Action Target Array
            var actionTargetArray = "action";


            /// All available actions
            var availableActions = [];

            /**
             * Adds a new available action
             * 
             * @param {object} action Action
             */
            Shapes.addAvailableAction = function(action) {
                availableActions.push(action);
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
                        this.model.set("actionData", null);
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
                        currentAction.onInitialized(actionContent, this);
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
                return  "<div class='gn-actionNodeObjectSelectContainer'><a class='gn-actionNodeObjectSelect gn-clickable'>" + this.getChooseLabel() + "</a></div>" +
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
             * Returns true if the object can be loaded, else false
             * 
             * @returns {bool} true if the object can be loaded, else false
             */
            Actions.ChangeValueChooseObjectAction.prototype.canLoadObject = function() {
                return !!this.nodeModel.get("objectId");
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
                contentElement.find(".gn-actionNodeObjectSelect").on("click", function() {
                    self.openSearchDialog().then(function(fieldObject) {
                        self.nodeModel.set("objectId", fieldObject.id);
                        self.loadFields(contentElement, actionNode);

                        contentElement.find(".gn-actionNodeObjectSelect").text(fieldObject.name);
                    });
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
    (function(Evne) {
        (function(Actions) {

            /// Action Type for changing the current skill value
            var actionTypeChangeCurrentSkillValue = 13;

            /**
             * Change current skill value Action
             * @class
             */
            Actions.ChangeCurrentSkillValueAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.ChangeValueAction.apply(this);
            };

            Actions.ChangeCurrentSkillValueAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.ChangeValueAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.ChangeCurrentSkillValueAction.prototype.buildAction = function() {
                return new Actions.ChangeCurrentSkillValueAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.ChangeCurrentSkillValueAction.prototype.getType = function() {
                return actionTypeChangeCurrentSkillValue;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.ChangeCurrentSkillValueAction.prototype.getLabel = function() {
                return Evne.Localization.Actions.ChangeCurrentSkillValueLabel;
            };

            /**
             * Returns the object type name. Used for dependency objects
             * 
             * @returns {string} Object Type name used for depends on objects 
             */
            Actions.ChangeCurrentSkillValueAction.prototype.getObjectTypeName = function() {
                return Actions.RelatedToObjectSkill;
            };
            
            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ChangeCurrentSkillValueAction.prototype.getObjectId = function() {
                return Evne.getCurrentSkillId();
            };

            /**
             * Returns the object resource
             * 
             * @returns {int} Object Resource
             */
            Actions.ChangeCurrentSkillValueAction.prototype.getObjectResource = function() {
                return GoNorth.DefaultNodeShapes.Shapes.ObjectResourceSkill;
            };

            /**
             * Loads the skill
             * 
             * @returns {jQuery.Deferred} Deferred for the skill loading
             */
            Actions.ChangeCurrentSkillValueAction.prototype.loadObject = function() {
                var def = new jQuery.Deferred();

                var self = this;
                jQuery.ajax({ 
                    url: "/api/EvneApi/FlexFieldObject?id=" + Evne.getCurrentSkillId(), 
                    type: "GET"
                }).done(function(data) {
                    def.resolve(data);
                }).fail(function(xhr) {
                    def.reject();
                });

                return def.promise();
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.ChangeCurrentSkillValueAction());

        }(Evne.Actions = Evne.Actions || {}));
    }(GoNorth.Evne = GoNorth.Evne || {}));
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
                return  "<input type='text' class='gn-nodeActionObjectState' placeholder='" + DefaultNodeShapes.Localization.Actions.StatePlaceholder + "'/>";
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
    (function(Evne) {
        (function(Actions) {

            /// Action Type for changing the target npc state
            var actionTypeChangeTargetNpcState = 16;

            /**
             * Change target npc state Action
             * @class
             */
            Actions.SetTargetNpcStateAction = function()
            {
                GoNorth.DefaultNodeShapes.Actions.SetObjectStateAction.apply(this);
            };

            Actions.SetTargetNpcStateAction.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Actions.SetObjectStateAction.prototype);

            /**
             * Builds the action
             * 
             * @returns {object} Action
             */
            Actions.SetTargetNpcStateAction.prototype.buildAction = function() {
                return new Actions.SetTargetNpcStateAction();
            };

            /**
             * Returns the type of the action
             * 
             * @returns {number} Type of the action
             */
            Actions.SetTargetNpcStateAction.prototype.getType = function() {
                return actionTypeChangeTargetNpcState;
            };

            /**
             * Returns the label of the action
             * 
             * @returns {string} Label of the action
             */
            Actions.SetTargetNpcStateAction.prototype.getLabel = function() {
                return Evne.Localization.Actions.SetTargetNpcStateLabel;
            };

            GoNorth.DefaultNodeShapes.Shapes.addAvailableAction(new Actions.SetTargetNpcStateAction());

        }(Evne.Actions = Evne.Actions || {}));
    }(GoNorth.Evne = GoNorth.Evne || {}));
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
    (function(Evne) {
        (function(Skill) {

            /// Text Type
            var textType = "evne.Text";

            /// Text Target Array
            var textTargetArray = "text";

            joint.shapes.evne = joint.shapes.evne || {};

            /**
             * Creates the text shape
             * @returns {object} Text shape
             * @memberof Skill
             */
            function createTextShape() {
                var model = joint.shapes.devs.Model.extend(
                {
                    defaults: joint.util.deepSupplement
                    (
                        {
                            type: textType,
                            icon: "glyphicon-text-background",
                            size: { width: 250, height: 150 },
                            inPorts: [ 'input' ],
                            outPorts: [ 'output' ],
                            attrs:
                            {
                                '.inPorts circle': { "magnet": "passive", "port-type": "input" },
                                '.outPorts circle': { "magnet": "true" } 
                            },
                            text: ""
                        },
                        joint.shapes.default.Base.prototype.defaults
                    )
                });
                return model;
            }

            /**
             * Creates a text view
             * @returns {object} Text view
             * @memberof Skill
             */
            function createTextView() {
                return joint.shapes.default.BaseView.extend(
                {
                    /**
                     * Template
                     */
                    template:
                    [
                        '<div class="node">',
                            '<span class="label"><i class="nodeIcon glyphicon"></i><span class="labelText"></span></span>',
                            '<button class="delete gn-nodeDeleteOnReadonly cornerButton" title="' + GoNorth.DefaultNodeShapes.Localization.DeleteNode + '">x</button>',
                            '<textarea class="nodeText" placeholder="' + Evne.Localization.TextNode.Text + '" />',
                        '</div>',
                    ].join('')
                });
            }

            /**
             * Text Shape
             */
            joint.shapes.evne.Text = createTextShape();

            /**
             * Text View
             */
            joint.shapes.evne.TextView = createTextView();


            /** 
             * Text Serializer 
             * 
             * @class
             */
            Skill.TextSerializer = function()
            {
                GoNorth.DefaultNodeShapes.Serialize.BaseNodeSerializer.apply(this, [joint.shapes.evne.Text, textType, textTargetArray ]);
            };

            Skill.TextSerializer.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.Serialize.BaseNodeSerializer.prototype)

            /**
             * Serializes a node
             * 
             * @param {object} node Node Object
             * @returns {object} Serialized NOde
             */
            Skill.TextSerializer.prototype.serialize = function(node) {
                var serializedData = {
                    id: node.id,
                    x: node.position.x,
                    y: node.position.y,
                    text: node.nodeText
                };

                return serializedData;
            };

            /**
             * Deserializes a serialized node
             * 
             * @param {object} node Serialized Node Object
             * @returns {object} Deserialized Node
             */
            Skill.TextSerializer.prototype.deserialize = function(node) {
                var initOptions = {
                    id: node.id,
                    position: { x: node.x, y: node.y },
                    nodeText: node.text
                };

                var node = new this.classType(initOptions);
                return node;
            };

            // Register Serializers
            var textSerializer = new Skill.TextSerializer();
            GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance().addNodeSerializer(textSerializer);

        }(Evne.Skill = Evne.Skill || {}));
    }(GoNorth.Evne = GoNorth.Evne || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(Evne) {
        (function(Skill) {

            /**
             * Skill View Model
             * @class
             */
            Skill.ViewModel = function()
            {
                GoNorth.DefaultNodeShapes.BaseViewModel.apply(this);
                GoNorth.FlexFieldDatabase.ObjectForm.BaseViewModel.apply(this, [ "/Evne", "EvneApi", "EvneSkill", "EvneTemplate", "GetPagesBySkill?skillId=", null ]);

                this.conditionDialog = new GoNorth.DefaultNodeShapes.Conditions.ConditionDialog();
            
                this.chooseObjectDialog = new GoNorth.ChooseObjectDialog.ViewModel();

                this.isSkillFlowExpanded = new ko.observable(false);
                this.loadedGraph = null;

                this.learnedByNpcs = new ko.observableArray();
                this.loadingLearnedByNpcs = new ko.observable(false);
                this.errorLoadingLearnedByNpcs = new ko.observable(false);

                this.init();

                // Add access to object id for actions and conditions
                var self = this;
                Evne.getCurrentSkillId = function() {
                    return self.id();
                };

                // Add access to condition dialog
                GoNorth.DefaultNodeShapes.openConditionDialog = function(condition) {
                    if(self.isReadonly())
                    {
                        var readonlyDeferred = new jQuery.Deferred();
                        readonlyDeferred.reject();
                        return readonlyDeferred.promise();
                    }

                    var conditionDialogDeferred = new jQuery.Deferred();
                    self.conditionDialog.openDialog(condition, conditionDialogDeferred);
                    return conditionDialogDeferred;
                };

                // Opens the quest search dialog 
                GoNorth.DefaultNodeShapes.openQuestSearchDialog = function() {
                    if(self.isReadonly())
                    {
                        var readonlyDeferred = new jQuery.Deferred();
                        readonlyDeferred.reject();
                        return readonlyDeferred.promise();
                    }

                    return self.chooseObjectDialog.openQuestSearch(Evne.Localization.SkillViewModel.ChooseQuest);                    
                };
                
                // Opens the npc search dialog 
                GoNorth.DefaultNodeShapes.openNpcSearchDialog = function() {
                    if(self.isReadonly())
                    {
                        var readonlyDeferred = new jQuery.Deferred();
                        readonlyDeferred.reject();
                        return readonlyDeferred.promise();
                    }

                    return self.chooseObjectDialog.openNpcSearch(Evne.Localization.SkillViewModel.ChooseNpc);                    
                };
            };

            Skill.ViewModel.prototype = jQuery.extend({ }, GoNorth.DefaultNodeShapes.BaseViewModel.prototype);
            Skill.ViewModel.prototype = jQuery.extend(Skill.ViewModel.prototype, GoNorth.FlexFieldDatabase.ObjectForm.BaseViewModel.prototype);

            /**
             * Toogles the skill flow visibility
             */
            Skill.ViewModel.prototype.toogleSkillFlowVisibility = function() {
                this.isSkillFlowExpanded(!this.isSkillFlowExpanded());

                if(this.isSkillFlowExpanded() && this.loadedGraph)
                {
                    this.parseGraph(this.loadedGraph);
                    this.loadedGraph = null;
                }
            };

            /**
             * Parses additional data from a loaded object
             * 
             * @param {object} data Data returned from the webservice
             */
            Skill.ViewModel.prototype.parseAdditionalData = function(data) {
                // Graph can not be expanded if its hidden or else JointJS will throw an error
                if(this.isSkillFlowExpanded())
                {
                    this.parseGraph(data);
                }
                else
                {
                    this.loadedGraph = data;
                }
            };

            /**
             * Parses the graph from loaded data
             * 
             * @param {object} data Data returned from the webservice
             */
            Skill.ViewModel.prototype.parseGraph = function(data) {
                var self = this;
                GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance().deserializeGraph(this.nodeGraph(), data, function(newNode) { self.setupNewNode(newNode); });
            
                if(this.isReadonly())
                {
                    this.setGraphToReadonly();
                }
            };

            /**
             * Sets Additional save data
             * 
             * @param {object} data Save data
             * @returns {object} Save data with additional values
             */
            Skill.ViewModel.prototype.setAdditionalSaveData = function(data) {
                var nodeSerializer = GoNorth.DefaultNodeShapes.Serialize.getNodeSerializerInstance();
                var serializedGraph = nodeSerializer.serializeGraph(this.nodeGraph());
                if(this.loadedGraph)
                {
                    serializedGraph = {};
                    for(var curGraphProperty in this.loadedGraph)
                    {
                        if(nodeSerializer.hasDeserializerForArray(curGraphProperty))
                        {
                            serializedGraph[curGraphProperty] = this.loadedGraph[curGraphProperty];
                        }
                    }
                }

                for(var curNodeArray in serializedGraph)
                {
                    if(serializedGraph.hasOwnProperty(curNodeArray))
                    {
                        data[curNodeArray] = serializedGraph[curNodeArray];
                    }
                }

                return data;
            };
            
            /**
             * Runs logic after save
             * 
             * @param {object} data Returned data after save
             */
            Skill.ViewModel.prototype.runAfterSave = function(data) {
                this.reloadFieldsForNodes(GoNorth.DefaultNodeShapes.Shapes.ObjectResourceSkill, this.id());
                
                GoNorth.BindingHandlers.nodeGraphRefreshPositionZoomUrl();
            };

            /**
             * Loads additional dependencies
             */
            Skill.ViewModel.prototype.loadAdditionalDependencies = function() {
                if(GoNorth.FlexFieldDatabase.ObjectForm.hasKortistoRights && !this.isTemplateMode())
                {
                    this.loadNpcsByLearnedSkill();
                }
            };

            /**
             * Opens the compare dialog for the current object
             * 
             * @returns {jQuery.Deferred} Deferred which gets resolved after the object is marked as implemented
             */
            Skill.ViewModel.prototype.openCompareDialogForObject = function() {
                return this.compareDialog.openSkillCompare(this.id(), this.objectName());
            };

            /**
             * Sets additional data to readonly
             */
            Skill.ViewModel.prototype.setAdditionalDataToReadonly = function() {
                this.setGraphToReadonly();
            };

            /**
             * Loads the npcs which have learned the skill
             */
            Skill.ViewModel.prototype.loadNpcsByLearnedSkill = function() {
                this.loadingLearnedByNpcs(true);
                this.errorLoadingLearnedByNpcs(false);
                var self = this;
                jQuery.ajax({ 
                    url: "/api/KortistoApi/GetNpcsByLearnedSkill?skillId=" + this.id(), 
                    type: "GET"
                }).done(function(data) {
                    self.learnedByNpcs(data);
                    self.loadingLearnedByNpcs(false);
                }).fail(function(xhr) {
                    self.errorLoadingLearnedByNpcs(true);
                    self.loadingLearnedByNpcs(false);
                });
            };

            /**
             * Builds the url for a Kortisto Npc
             * 
             * @param {object} npc Npc to open
             * @returns {string} Url for the npc
             */
            Skill.ViewModel.prototype.buildNpcSkillUrl = function(npc) {
                return "/Kortisto/Npc?id=" + npc.id;
            };

        }(Evne.Skill = Evne.Skill || {}));
    }(GoNorth.Evne = GoNorth.Evne || {}));
}(window.GoNorth = window.GoNorth || {}));