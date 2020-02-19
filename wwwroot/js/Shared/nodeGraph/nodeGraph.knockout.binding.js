(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Connections) {

            /**
             * Creates a default link
             * @param {object} initData Data for initalizing
             */
            Connections.createDefaultLink = function(initData) {
                var linkData = {
                    attrs: {
                        ".marker-target": { d: "M 10 0 L 0 5 L 10 10 z" },
                        ".link-tools .tool-remove circle, .marker-vertex": { r: 8 }
                    }
                };
                if(initData)
                {
                    linkData = jQuery.extend(initData, linkData);
                }
                var link = new joint.dia.Link(linkData);
                link.set("smooth", true);
                return link;
            };

        }(DefaultNodeShapes.Connections = DefaultNodeShapes.Connections || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Shapes) {

            joint.shapes.default = joint.shapes.default || {};

            /**
             * Base Shape
             */
            joint.shapes.default.Base = joint.shapes.devs.Model.extend(
            {
                defaults: joint.util.deepSupplement
                (
                    {
                        type: 'default.Base',
                        size: { width: 200, height: 64 },
                        nodeText: '',
                        attrs:
                        {
                            rect: { stroke: 'none', 'fill-opacity': 0 },
                            text: { display: 'none' },
                        },
                    },
                    joint.shapes.devs.Model.prototype.defaults
                ),
            });

            /**
             * Base Shape View
             */
            joint.shapes.default.BaseView = joint.shapes.devs.ModelView.extend(
            {
                /**
                 * Template
                 */
                template:
                [
                    '<div class="node">',
                        '<span class="label"><i class="nodeIcon glyphicon"></i><span class="labelText"></span></span>',
                        '<button class="delete" title="' + GoNorth.DefaultNodeShapes.Localization.DeleteNode + '">x</button>',
                    '</div>',
                ].join(''),

                /**
                 * Initializes the shape
                 */
                initialize: function() {
                    _.bindAll(this, 'updateBox');
                    joint.shapes.devs.ModelView.prototype.initialize.apply(this, arguments);

                    this.$box = jQuery(_.template(this.template)());
                    // Prevent paper from handling pointerdown.
                    this.$box.find('input').on('mousedown click', function(evt) { evt.stopPropagation(); });

                    this.$box.find('.nodeText').on('change', _.bind(function(evt)
                    {
                        this.model.set('nodeText', jQuery(evt.target).val());
                    }, this));

                    this.$box.find('.delete').on('click', _.bind(function() {
                        if(!this.model.onDelete)
                        {
                            this.model.remove();
                        }
                        else
                        {
                            var self = this;
                            this.model.onDelete(this).done(function() {
                                self.model.remove();
                            });
                        }
                    }, this));

                    if(this.additionalCallbackButtons)
                    {
                        var callbacks = this.additionalCallbackButtons;
                        var self = this;
                        jQuery.each(callbacks, function(key) {
                            self.$box.find("." + key).on("click", _.bind(function() {
                                callbacks[key].apply(self);
                            }, self));
                        });
                    }

                    this.model.on('change', this.updateBox, this);
                    this.model.on('remove', this.removeBox, this);

                    this.updateBox();
                },

                /**
                 * Renders the shape
                 */
                render: function() {
                    joint.shapes.devs.ModelView.prototype.render.apply(this, arguments);
                    
                    this.listenTo(this.paper, "scale", this.updateBox);
                    this.listenTo(this.paper, "translate", this.updateBox);

                    this.paper.$el.prepend(this.$box);
                    this.updateBox();
                    return this;
                },

                /**
                 * Updates the box
                 */
                updateBox: function() {
                    var bbox = this.model.getBBox();
                    if(this.paper)
                    {
                        bbox.x = bbox.x * this.paper.scale().sx + this.paper.translate().tx;
                        bbox.y = bbox.y * this.paper.scale().sy + this.paper.translate().ty;
                        bbox.width *= this.paper.scale().sx;
                        bbox.height *= this.paper.scale().sy;
                    }

                    var textField = this.$box.find('.nodeText');
                    if (!textField.is(':focus'))
                    {
                        textField.val(this.model.get('nodeText'));
                    }

                    var label = this.$box.find('.labelText');
                    var type = this.model.get('type');
                    label.text(DefaultNodeShapes.Localization.TypeNames[type]);
                    this.$box.find('.label').attr('class', 'label ' + type.replace(".", "_"));

                    if(this.model.get("icon"))
                    {
                        this.$box.find(".nodeIcon").addClass(this.model.get("icon"));
                    }
                    else
                    {
                        this.$box.find(".nodeIcon").remove();
                    }

                    this.$box.css({ width: bbox.width, height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
                },

                /**
                 * Removes the box
                 */
                removeBox: function(evt) {
                    this.$box.remove();
                },

                /**
                 * Checks if a node can be deleted
                 * 
                 * @returns {jQuery.Deferred} Deferred for the validation process
                 */
                validateDelete: function() {
                    return null;
                }
            });

        }(DefaultNodeShapes.Shapes = DefaultNodeShapes.Shapes || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Shapes) {

            /**
             * Text Shape
             */
            joint.shapes.default.Text = joint.shapes.devs.Model.extend(
            {
                defaults: joint.util.deepSupplement
                (
                    {
                        type: 'default.Text',
                        inPorts: ['input'],
                        outPorts: ['output'],
                        attrs:
                        {
                            '.outPorts circle': { unlimitedConnections: ['default.Choice'], }
                        },
                    },
                    joint.shapes.default.Base.prototype.defaults
                )
            });

            /**
             * Text View
             */
            joint.shapes.default.TextView = joint.shapes.default.BaseView.extend(
            {
                /**
                 * Template
                 */
                template:
                [
                    '<div class="node">',
                        '<span class="label"></span>',
                        '<button class="delete" title="' + GoNorth.DefaultNodeShapes.Localization.DeleteNode + '">x</button>',
                        '<input type="text" class="name" placeholder="' + DefaultNodeShapes.Localization.TextPlaceHolder + '" />',
                    '</div>',
                ].join('')
            });

        }(DefaultNodeShapes.Shapes = DefaultNodeShapes.Shapes || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Serialize) {

            /** 
             * Node Serializer Base
             * 
             * @param {object} classType Class Type
             * @param {string} type Type for the serialization
             * @param {string} serializeArrayName Name of the target array for the serialization
             * @class
             */
            Serialize.BaseNodeSerializer = function(classType, type, serializeArrayName) {
                this.classType = classType;
                this.type = type;
                this.serializeArrayName = serializeArrayName;
            }

            Serialize.BaseNodeSerializer.prototype = {
                /**
                 * Serializes a node
                 * 
                 * @param {object} node Node Object
                 * @returns {object} Serialized NOde
                 */
                serialize: function(node) {

                },

                /**
                 * Deserializes a serialized node
                 * 
                 * @param {object} node Serialized Node Object
                 * @returns {object} Deserialized Node
                 */
                deserialize: function(node) {

                },

                /**
                 * Creates a new node
                 * @param {object} initOptions Init Options
                 * @returns {object} New Node
                 */
                createNewNode: function(initOptions) {
                    return new this.classType(initOptions);
                }
            }

        }(DefaultNodeShapes.Serialize = DefaultNodeShapes.Serialize || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(DefaultNodeShapes) {
        (function(Serialize) {


            /// Link Name
            var linkName = "link";


            /**
             * Serializer
             * @class
             */
            var serializer = function()
            {
                this.nodeSerializer = {};
                this.nodeDeserializer = {};
            };

            serializer.prototype = {
                /**
                 * Adds a node serializer
                 * 
                 * @param {object} nodeSerializer Node Serializer
                 */
                addNodeSerializer: function(nodeSerializer) {
                    this.nodeSerializer[nodeSerializer.type] = nodeSerializer;
                    this.nodeDeserializer[nodeSerializer.serializeArrayName] = nodeSerializer;
                },

                /**
                 * Returns true if a serializes exists for a target array name
                 * 
                 * @param {string} targetArrayName Target Array Name
                 * @returns {bool} true if a serializer exists, else false
                 */
                hasDeserializerForArray: function(targetArrayName) {
                    if(targetArrayName == linkName)
                    {
                        return true;
                    }
                    return !!this.nodeDeserializer[targetArrayName];
                },

                /**
                 * Serializes a graph
                 * 
                 * @returns {object} Serialized Objects
                 */
                serializeGraph: function(graph) {
                    var serializedGraph = graph.toJSON();
                    var serializedObjects = {};
                    serializedObjects[linkName] = [];
                    for(var curCell = 0; curCell < serializedGraph.cells.length; ++curCell)
                    {
                        var cellType = serializedGraph.cells[curCell].type;
                        if(cellType == linkName)
                        {
                            serializedObjects[linkName].push(this.serializeLink(serializedGraph.cells[curCell]));
                        }
                        else
                        {
                            if(!this.nodeSerializer[cellType])
                            {
                                throw { error: "Unknown node type: " + cellType };
                            }

                            var targetArrayName = this.nodeSerializer[cellType].serializeArrayName;
                            if(!serializedObjects[targetArrayName])
                            {
                                serializedObjects[targetArrayName] = [];
                            }

                            serializedObjects[targetArrayName].push(this.nodeSerializer[cellType].serialize(serializedGraph.cells[curCell]));
                        }
                    }

                    return serializedObjects;
                },

                /**
                 * Deserializes a graph
                 * 
                 * @param {object} targetGraph Graph to fill
                 * @param {object} serializedData Serialized Data
                 * @param {function} nodeAddCallback Optional Callback function which gets called for each new node added to the graph
                 */
                deserializeGraph: function(targetGraph, serializedData, nodeAddCallback) {
                    targetGraph.clear();
                    for(var curNodeCollection in serializedData)
                    {
                        if(!this.nodeDeserializer[curNodeCollection])
                        {
                            continue;
                        }

                        var nodeCollection = serializedData[curNodeCollection];
                        if(!nodeCollection)
                        {
                            continue;
                        }

                        for(var curNode = 0; curNode < nodeCollection.length; ++curNode)
                        {
                            var newNode = this.nodeDeserializer[curNodeCollection].deserialize(nodeCollection[curNode]);
                            targetGraph.addCell(newNode);
                            if(typeof nodeAddCallback === "function")
                            {
                                nodeAddCallback(newNode);
                            }
                        }
                    }

                    var linkCollection = serializedData[linkName];
                    if(linkCollection)
                    {
                        for(var curLink = 0; curLink < linkCollection.length; ++curLink)
                        {
                            var newLink = this.deserializeLink(linkCollection[curLink]);
                            targetGraph.addCell(newLink);
                        }
                    }
                },


                /**
                 * Serializes a link
                 * 
                 * @param {object} linkObject
                 */
                serializeLink: function(linkObject) {
                    var serializedLink = {
                        sourceNodeId: linkObject.source.id,
                        sourceNodePort: linkObject.source.port,
                        targetNodeId: linkObject.target.id,
                        targetNodePort: linkObject.target.port,
                        vertices: linkObject.vertices
                    };

                    return serializedLink;
                },

                /**
                 * Deserializes a link
                 * 
                 * @param {object} linkObject
                 */
                deserializeLink: function(serializedLink) {
                    var linkObject = DefaultNodeShapes.Connections.createDefaultLink({
                        source: 
                        { 
                            id: serializedLink.sourceNodeId,
                            port: serializedLink.sourceNodePort
                        },
                        target: 
                        { 
                            id: serializedLink.targetNodeId,
                            port: serializedLink.targetNodePort
                        },
                        vertices: serializedLink.vertices
                    });

                    return linkObject;
                },



                /**
                 * Creates a new node
                 * 
                 * @param {string} type Node Type
                 * @param {object} initOptions Init Options
                 * @returns {object} New Node
                 */
                createNewNode: function(type, initOptions) {
                    if(!this.nodeSerializer[type])
                    {
                        return null;
                    }

                    return this.nodeSerializer[type].createNewNode(initOptions);
                }
            };


            var serializerInstance = new serializer();

            /**
             * Returns the serializer instance
             * 
             * @returns {object} Node Graph Serializer
             */
            Serialize.getNodeSerializerInstance = function() {
                return serializerInstance;
            }

        }(DefaultNodeShapes.Serialize = DefaultNodeShapes.Serialize || {}));
    }(GoNorth.DefaultNodeShapes = GoNorth.DefaultNodeShapes || {}));
}(window.GoNorth = window.GoNorth || {}));
(function(GoNorth) {
    "use strict";
    (function(BindingHandlers) {

        if(typeof ko !== "undefined")
        {

            /// Scale Step
            var scaleStep = 0.1;

            /// Min Scale
            var minScale = 0.1;

        
            /**
             * Calculates the touch distance
             * @param {object[]} touches Touch objects
             * @returns {float} Touch distance
             */
            function calcTouchDistance(touches) {
                var distanceX = touches[0].screenX - touches[1].screenX;
                var distanceY = touches[0].screenY - touches[1].screenY;
                return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            }


            /**
             * Rounds a value to one digit
             * @param {float} value Value to round
             * @returns {float} Rounded Value
             */
            function roundToOneDigit(value) {
                return Math.round(value * 10) / 10;
            }

            /**
             * Updates the position and zoom display
             * @param {object} element Html which contains the display element
             * @param {object} paper JointJs paper
             */
            function updatePositionZoomDisplay(element, paper) {
                var scale = paper.scale().sx;
                var displayString = GoNorth.DefaultNodeShapes.Localization.NodeDisplay.Position + " " + roundToOneDigit(-paper.translate().tx) + "," + roundToOneDigit(-paper.translate().ty) + " ";
                displayString += GoNorth.DefaultNodeShapes.Localization.NodeDisplay.Zoom + " " + roundToOneDigit(scale);

                jQuery(element).find(".gn-nodeGraphPositionZoomIndicatorText").text(displayString);
            }

            /**
             * Updates the position and zoom in the url for the node graph
             * @param {object} paper JointJs paper
             */
            function updatePositionZoomUrl(paper) {
                var urlParams = "nodeX=" + roundToOneDigit(paper.translate().tx);
                urlParams += "&nodeY=" + roundToOneDigit(paper.translate().ty);
                urlParams += "&nodeZoom=" + roundToOneDigit(paper.scale().sx);

                var finalParams = window.location.search;
                if(finalParams) 
                {
                    finalParams = finalParams.replace(/nodeX=.*?&nodeY=.*?&nodeZoom=.*?(&|$)/i, "");
                    if(finalParams[finalParams.length - 1] != "&")
                    {
                        finalParams += "&";
                    }
                    finalParams += urlParams;
                }
                else
                {
                    finalParams = "?" + urlParams;
                }

                window.history.replaceState(finalParams, null, finalParams)
            }

            /**
             * Updates the mini map
             * 
             * @param {object} element Element containing the node graph
             * @param {object} paper Paper object
             * @param {bool} showMiniMap true if the mini map is shown, else false
             */
            function updateMiniMap(element, paper, showMiniMap) {
                if(!showMiniMap)
                {
                    return;
                }

                var miniMapContainer = jQuery(element).children(".gn-nodeGraphMiniMap");
                var sourceSvg = jQuery(element).children("svg");
                if(sourceSvg.length == 0)
                {
                    return;
                }

                // Get Positions and Viewports
                var viewBoundingBox = paper.getContentBBox();
                var scale = paper.scale().sx;
                var position = paper.translate();
                viewBoundingBox.x /= scale;
                viewBoundingBox.y /= scale;
                viewBoundingBox.width /= scale;
                viewBoundingBox.height /= scale;
                viewBoundingBox.x -= position.tx / scale;
                viewBoundingBox.y -= position.ty / scale;
                viewBoundingBox.right = viewBoundingBox.x + viewBoundingBox.width;
                viewBoundingBox.bottom = viewBoundingBox.y + viewBoundingBox.height;

                var parentElement = jQuery(element).parent();
                var viewPortBoundingBox = {
                    x: -position.tx / scale,
                    y: -position.ty / scale,
                    width: parentElement.width() / scale,
                    height: parentElement.height() / scale
                };

                // Adjust view bounding box to always incoperate camera
                if(viewPortBoundingBox.x < viewBoundingBox.x)
                {
                    viewBoundingBox.x = viewPortBoundingBox.x;
                }
                if(viewPortBoundingBox.x + viewPortBoundingBox.width > viewBoundingBox.right)
                {
                    viewBoundingBox.right = viewPortBoundingBox.x + viewPortBoundingBox.width;
                }

                if(viewPortBoundingBox.y < viewBoundingBox.y)
                {
                    viewBoundingBox.y = viewPortBoundingBox.y;
                }
                if(viewPortBoundingBox.y + viewPortBoundingBox.height > viewBoundingBox.bottom)
                {
                    viewBoundingBox.bottom = viewPortBoundingBox.y + viewPortBoundingBox.height;
                }

                // Get Node SVG and adjust it for mini map
                viewBoundingBox.width = viewBoundingBox.right - viewBoundingBox.x;
                viewBoundingBox.height = viewBoundingBox.bottom - viewBoundingBox.y;
                var miniMap = jQuery(sourceSvg[0].outerHTML);
                miniMap.attr("viewBox", viewBoundingBox.x + " " + viewBoundingBox.y + " " + viewBoundingBox.width + " " + viewBoundingBox.height);
                miniMap.children(".joint-viewport").removeAttr("transform");
                miniMap.find("rect").attr("fill-opacity", "1");
                miniMap.find("rect").attr("fill", "#666");
                miniMap.find("path").attr("fill", "none");
                miniMap.find(".tool-options").remove();
                miniMap.find(".tool-remove").remove();

                // Add viewport
                var viewPortStrokeWidth = viewBoundingBox.width / 400;
                miniMap.children(".joint-viewport").append("<rect width='" + viewPortBoundingBox.width + "' height='" + viewPortBoundingBox.height + "' transform='translate(" + viewPortBoundingBox.x + "," + viewPortBoundingBox.y + ")' fill='none' stroke='#fff' style='stroke-width: " + viewPortStrokeWidth + "'></rect>");

                miniMapContainer.html(miniMap[0].outerHTML);
            }

            // Create throttled version of update mini map
            var throttledUpdatedMiniMap = GoNorth.Util.throttle(updateMiniMap, 35);
            var debouncedUpdatePositionZoomUrl = GoNorth.Util.debounce(updatePositionZoomUrl, 250);

            /**
             * Node Graph Binding Handler
             */
            ko.bindingHandlers.nodeGraph = {
                init: function (element, valueAccessor, allBindings) {
                    var allowMultipleOutboundForNodes = false;
                    if(allBindings.get("nodeGraphAllowMultpleOutbound"))
                    {
                        allowMultipleOutboundForNodes = allBindings.get("nodeGraphAllowMultpleOutbound");
                    }

                    var enableNodeGraphPositionZoomUrl = true;
                    if(allBindings.get("nodeGraphDisablePositionZoomUrl"))
                    {
                        enableNodeGraphPositionZoomUrl = !allBindings.get("nodeGraphDisablePositionZoomUrl");
                    }

                    var graph = new joint.dia.Graph();
                    var paper = new joint.dia.Paper(
                    {
                        el: element,
                        width: 16000,
                        height: 8000,
                        gridSize: 1,
                        model: graph,
                        defaultLink: GoNorth.DefaultNodeShapes.Connections.createDefaultLink(),
                        snapLinks: { radius: 75 }, 
                        markAvailable: true,
                        linkPinning: false,
                        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
                          // Prevent linking from output ports to input ports within one element.
                          if (cellViewS === cellViewT) 
                          {
                              return false;
                          }

                          // Prevent linking to output ports.
                          return magnetT.getAttribute("port-type") === "input";
                        },
                        validateMagnet: function(cellView, magnet) {
                            if(allowMultipleOutboundForNodes)
                            {
                                return magnet.getAttribute("magnet") !== "passive";
                            }

                            var port = magnet.getAttribute("port");

                            // Delete old links on new drag
                            var links = graph.getConnectedLinks(cellView.model, { outbound: true });
                            for(var curLink = links.length - 1; curLink >= 0; --curLink)
                            {
                                if(links[curLink].attributes && links[curLink].attributes.source && links[curLink].attributes.source.port === port)
                                {
                                    links[curLink].remove();
                                }
                            }
                            return magnet.getAttribute("magnet") !== "passive";
                        }
                    });

                    GoNorth.BindingHandlers.nodeGraphRefreshPositionZoomUrl = function() {
                        if(enableNodeGraphPositionZoomUrl) {
                            debouncedUpdatePositionZoomUrl(paper);
                        }
                    };

                    // Add mini Map update events
                    var showMiniMap = false;
                    graph.on("change", function() {
                        throttledUpdatedMiniMap(element, paper, showMiniMap);
                    });
                    graph.on("add", function() {
                        throttledUpdatedMiniMap(element, paper, showMiniMap);
                    });
                    graph.on("remove", function() {
                        throttledUpdatedMiniMap(element, paper, showMiniMap);
                    });
                    jQuery(window).resize(function() {
                        throttledUpdatedMiniMap(element, paper, showMiniMap);
                    });

                    // Set Observables
                    var graphObs = valueAccessor();
                    if(ko.isObservable(graphObs))
                    {
                        graphObs(graph);
                    }

                    var paperObs = allBindings.get("nodePaper");
                    if(paperObs && ko.isObservable(paperObs))
                    {
                        paperObs(paper);
                    }

                    // Zoom
                    jQuery(element).on("mousewheel DOMMouseScroll", function(event) {
                        var wheelDirection = 1;
                        if(event.originalEvent.wheelDelta < 0 || event.originalEvent.detail > 0)
                        {
                            wheelDirection = -1;
                        }

                        var oldScale = paper.scale().sx;
                        var newScale = oldScale + wheelDirection * scaleStep;
                        if(newScale >= minScale)
                        {
                            paper.scale(newScale, newScale);
                            updatePositionZoomDisplay(element, paper);
                            if(enableNodeGraphPositionZoomUrl) {
                                debouncedUpdatePositionZoomUrl(paper);
                            }
                            throttledUpdatedMiniMap(element, paper, showMiniMap);
                        }

                        event.preventDefault();
                    });

                    // Pan
                    var dragStartPosition = null;
                    var blockStart = false;
                    paper.on('blank:pointerdown', function(event, x, y) {
                        jQuery(element).addClass("gn-nodeGraph-dragging");
                        if(!blockStart)
                        {
                            dragStartPosition = { x: x * paper.scale().sx, y: y * paper.scale().sy};
                        }
                    });

                    paper.on('cell:pointerup blank:pointerup', function(cellView, x, y) {
                        jQuery(element).removeClass("gn-nodeGraph-dragging");
                        dragStartPosition = null;
                    });

                    jQuery(element).on("mousemove", function(event) {
                        if(dragStartPosition)
                        {
                            paper.translate(event.offsetX - dragStartPosition.x, event.offsetY - dragStartPosition.y);
                            updatePositionZoomDisplay(element, paper);
                            if(enableNodeGraphPositionZoomUrl) {
                                debouncedUpdatePositionZoomUrl(paper);
                            }
                            throttledUpdatedMiniMap(element, paper, showMiniMap);
                        }
                    });

                    // Touch
                    var dragStartTransform = null;
                    var dragStartDistance = null;
                    var dragStartScale = null;
                    jQuery(element).find("svg").on("touchstart", function(event) {
                        if(jQuery(event.target).attr("id") != jQuery(element).find("svg").attr("id"))
                        {
                            return;
                        }

                        if(event.originalEvent.touches && event.originalEvent.touches.length == 1)
                        {
                            dragStartPosition = { x: event.originalEvent.touches[0].screenX, y: event.originalEvent.touches[0].screenY };
                            dragStartTransform = { x: paper.translate().tx, y: paper.translate().ty }
                            blockStart = true;
                            setTimeout(function() {
                                blockStart = false;
                            }, 10);
                        }
                        else if(event.originalEvent.touches && event.originalEvent.touches.length == 2)
                        {
                            dragStartDistance = calcTouchDistance(event.originalEvent.touches);
                            dragStartScale = paper.scale().sx;
                        }
                    });

                    jQuery(element).on("touchmove", function(event) {
                        if(dragStartPosition && event.originalEvent.touches && event.originalEvent.touches.length == 1)
                        {
                            paper.translate(event.originalEvent.touches[0].screenX - dragStartPosition.x + dragStartTransform.x, event.originalEvent.touches[0].screenY - dragStartPosition.y + dragStartTransform.y);
                            updatePositionZoomDisplay(element, paper);
                            if(enableNodeGraphPositionZoomUrl) {
                                debouncedUpdatePositionZoomUrl(paper);
                            }
                            throttledUpdatedMiniMap(element, paper, showMiniMap);
                        }
                        else if(dragStartDistance && event.originalEvent.touches && event.originalEvent.touches.length == 2)
                        {
                            var newDistance = calcTouchDistance(event.originalEvent.touches);
                            var newScale = dragStartScale * (newDistance / dragStartDistance);
                            if(newScale >= minScale)
                            {
                                paper.scale(newScale, newScale);
                                updatePositionZoomDisplay(element, paper);
                                if(enableNodeGraphPositionZoomUrl) {
                                    debouncedUpdatePositionZoomUrl(paper);
                                }
                                throttledUpdatedMiniMap(element, paper, showMiniMap);
                            }
                        }
                    });

                    jQuery(element).on("touchend touchcancel", function(event) {
                        dragStartPosition = null;
                        dragStartTransform = null;
                        dragStartDistance = null;
                        dragStartScale = null;
                    });

                    // Url Position / Zoom
                    var urlPositionX = parseFloat(GoNorth.Util.getParameterFromUrl("nodeX"));
                    var urlPositionY = parseFloat(GoNorth.Util.getParameterFromUrl("nodeY"));
                    var urlZoom = parseFloat(GoNorth.Util.getParameterFromUrl("nodeZoom"));
                    if(!isNaN(urlPositionX) && !isNaN(urlPositionY))
                    {
                        paper.translate(urlPositionX, urlPositionY);
                    }
                    if(!isNaN(urlZoom))
                    {
                        paper.scale(urlZoom, urlZoom);
                    }

                    // Styling
                    jQuery(element).addClass("gn-nodeGraph");

                    jQuery(element).append("<div class='gn-nodeGraphPositionZoomIndicator'><span class='gn-nodeGraphPositionZoomIndicatorText'></span><span><a class='gn-clickable gn-nodeGraphToogleMinimap' title='" + GoNorth.DefaultNodeShapes.Localization.NodeDisplay.ToogleMiniMap + "'><i class='glyphicon glyphicon-chevron-down'></i></a></span></div>");
                    jQuery(element).append("<div class='gn-nodeGraphMiniMap' style='display: none'></div>");

                    jQuery(element).find(".gn-nodeGraphToogleMinimap").click(function() {
                        showMiniMap = !showMiniMap;
                        if(showMiniMap)
                        {
                            jQuery(element).find(".gn-nodeGraphMiniMap").slideDown(200);
                            jQuery(this).children("i").removeClass("glyphicon-chevron-down");
                            jQuery(this).children("i").addClass("glyphicon-chevron-up");
                            throttledUpdatedMiniMap(element, paper, showMiniMap);
                        }
                        else
                        {
                            jQuery(element).find(".gn-nodeGraphMiniMap").slideUp(200);
                            jQuery(this).children("i").removeClass("glyphicon-chevron-up");
                            jQuery(this).children("i").addClass("glyphicon-chevron-down");
                        }
                    });

                    updatePositionZoomDisplay(element, paper);
                    if(enableNodeGraphPositionZoomUrl) {
                        debouncedUpdatePositionZoomUrl(paper);
                    }
                },
                update: function (element, valueAccessor) {
                }
            }

        }

    }(GoNorth.BindingHandlers = GoNorth.BindingHandlers || {}));
}(window.GoNorth = window.GoNorth || {}));