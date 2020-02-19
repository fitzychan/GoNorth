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