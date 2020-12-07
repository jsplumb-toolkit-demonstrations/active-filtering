;
(function () {

    var root = this;
    var jsPlumb = root.jsPlumb;

    jsPlumbToolkit.ready(function () {

        var toolkit = jsPlumbToolkit.newInstance({
            beforeConnect:function(source, target) {
                // ignore node->node connections; our UI is not configured to produce them. we could catch it and
                // return false, though, which would ensure that nodes could not be connected programmatically.
                if (source.objectType !== "Node" && target.objectType !== "Node") {

                    // cannot create loopback connections
                    if (source === target) {
                        return false;
                    }

                    // cannot connect to Ports on the same Node as the Edge source
                    if (source.getNode() === target.getNode()) {
                        return false;
                    }

                    var sourceData = source.getNode().data,
                        targetData = target.getNode().data;

                    // attempt to match animals
                    var sourceItem  = sourceData.items[source.id];
                    var targetItem  = targetData.items[target.id];
                    if (sourceItem.entries && targetItem.entries) {
                        for (var i = 0; i < sourceItem.entries.length; i++) {
                            if (targetItem.entries.indexOf(sourceItem.entries[i]) !== -1) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
            }
        });

        var mainElement = document.querySelector("#jtk-demo-connectivity"),
            canvasElement = mainElement.querySelector(".jtk-demo-canvas"),
            miniviewElement = mainElement.querySelector(".miniview");

// ----------------------- this code is the random node generator. it's just for this demo --------------------------------------

        var words = [
            "CAT", "DOG", "COW", "HORSE", "DUCK", "HEN"
        ];

        var randomPort = function(index) {
            var out = [], map = {};
            function _one() {
                var a, done = false;
                while (!done) {
                    a = words[Math.floor(Math.random() * words.length)];
                    done = map[a] !== true;
                    map[a] = true;
                }
                return a;
            }
            out.push(_one());
            out.push(_one());
            return { entries:out, index:index };
        };

        var newNode = function() {
            var groupCount = Math.floor(Math.random() * 3) + 1,
                data = {
                    id:jsPlumbUtil.uuid(),
                    items:[]
                };

            for (var i = 0; i < groupCount; i++) {
                data.items.push(randomPort(i));
            }

            return toolkit.addNode(data);
        };


// ---------------------------- / end random node generator ---------------------------------------------

        // initial dataset consists of 5 random nodes.
        var nodeCount = 5;
        for (var i = 0; i < nodeCount;i++) {
            newNode();
        }


        var view = {
            nodes: {
                "default": {
                    template: "tmplNode"
                }
            },
            edges: {
                "default": {
                    connector: [ "StateMachine", { curviness: 10 } ],
                    endpoint: [ "Dot", { radius: 10 } ],
                    anchor: [ "Continuous", { faces:["left", "right"]} ]
                }
            }
        };

        var renderer = toolkit.render({
            container: canvasElement,
            zoomToFit: true,
            view: view,
            layout: {
                type: "Spring"
            },
            miniview: {
                container:miniviewElement
            },
            lassoFilter: ".controls, .controls *, .miniview, .miniview *",
            events: {
                canvasClick: function (e) {
                    toolkit.clearSelection();
                },
                modeChanged: function (mode) {
                    jsPlumb.removeClass(jsPlumb.getSelector("[mode]"), "selected-mode");
                    jsPlumb.addClass(jsPlumb.getSelector("[mode='" + mode + "']"), "selected-mode");
                }
            },
            consumeRightClick:false,
            activeFiltering:true
        });

        //
        // use event delegation to attach event handlers to
        // remove buttons. This callback finds the related Node and
        // then tells the toolkit to delete it.
        //
        jsPlumb.on(canvasElement, "tap", ".delete *", function (e) {
            var info = toolkit.getObjectInfo(this);
            var selection = toolkit.selectDescendants(info.obj, true);
            toolkit.remove(selection);
        });

        //
        // use event delegation to attach event handlers to
        // add buttons. This callback adds an edge from the given node
        // to a newly created node, and then the layout is refreshed.
        //
        jsPlumb.on(canvasElement, "tap", ".add *", function (e) {
            // this helper method can retrieve the associated
            // toolkit information from any DOM element.
            var info = toolkit.getObjectInfo(this);
            // get a random node.
            var n = jsPlumbToolkitDemoSupport.randomNode();
            // add the node to the toolkit
            var newNode = toolkit.addNode(n);
            // and add an edge for it from the current node.
            toolkit.addEdge({source: info.obj, target: newNode});
        });

        // pan mode/select mode
        jsPlumb.on(mainElement, "tap", "[mode]", function () {
            renderer.setMode(this.getAttribute("mode"));
        });

        // on home button tap, zoom content to fit.
        jsPlumb.on(mainElement, "tap", "[reset]", function () {
            toolkit.clearSelection();
            renderer.zoomToFit();
        });

        //
        // assign a class to a new node which brings the user's attention to it. then a little while later,
        // take it off.
        //
        function flash(el) {
            jsPlumb.addClass(el, "hl");
            setTimeout(function() {
                jsPlumb.removeClass(el, "hl");
            }, 1950);
        }

        jsPlumb.on(mainElement, "tap", "[add]", function() {
            var node = newNode();
            renderer.zoomToFit();
            flash(renderer.getRenderedElement(node));
        });

        var _syntaxHighlight = function (json) {
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return "<pre>" + json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                var cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            }) + "</pre>";
        };

        new jsPlumbSyntaxHighlighter(toolkit, ".jtk-demo-dataset");
    });
})();