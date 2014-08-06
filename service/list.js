//	require([
//	    "dojox/grid/EnhancedGrid",
//		"dojox/grid/enhanced/plugins/Pagination",
//	    "dojo/data/ItemFileReadStore",
//	    "dojo/request",
//	    "dojo/domReady!"
//		], function(EnhancedGrid, Memory, ObjectStore, request){
dojo.require("dojox.grid.EnhancedGrid");
dojo.require("dojox.grid.enhanced.plugins.Pagination");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojox.grid.enhanced.plugins.Filter");
dojo.require('dojo.request');
dojo.require('dojo.on');
dojo.require('dojo.query');
dojo.require('dijit.form.TextBox');
dojo.require('dojo.keys');

function showFilterBar(){
    dijit.byId('grid').showFilterBar(true);
}

function filter(){
    var grid = dijit.byId("grid");
    var query = dojo.query('#query_string')
    grid.setFilter({ type: 'string', column: 'anycolumn', condition: 'contains', value: query });
}

function reset_filter(){
    var grid = dijit.byId("grid");
    dojo.byId("query_string").value = "";
    grid.setFilter(null);
}

dojo.ready(function(){
    dojo.request.get("./servicecard.json",{
            handleAs: "json"
        }).then(function(items) {
        var datastore = new dojo.data.ItemFileReadStore({ data: { items: items }})
//			console.log(items);
        /*set up layout*/
        var layout = [[
            {name: 'id', field: 'id', width: '50px'},
//            {name: 'user', field: 'user_id', width: '50px'},
            {name: 'タイトル', field: 'title', width: '300px'},
            {name: 'リファレンス', field: 'reference', width: '250px'},
            {name: 'count', field: 'count', width: '50px'}
        ]];
        /*create a new grid:*/
        var grid = new dojox.grid.EnhancedGrid({
            id: 'grid',
            store: datastore,
            structure: layout,
            query:{ title: '*' },
        //		rowSelector: '20px',
            autoHeight: true,
            plugins: {
                pagination: {
                    pageSizes: ["25", "50", "100"],
                    description: true,
                    sizeSwitch: true,
                    pageStepper: true,
                    gotoButton: true,
                            /*page step to be displayed*/
                    maxPageStep: 4,
                            /*position of the pagination bar*/
                    position: "bottom"
                }
                ,filter: {
                    // Show the closeFilterbarButton at the filter bar
//                    closeFilterbarButton: true,
                    // Set the maximum rule count to 5
//                    ruleCount: 5
                    // Set the name of the items
//                    itemsName: "cards"
                }

            }
        }, document.createElement('div'));
        /*append the new grid to the div*/
        dojo.byId("gridDiv").appendChild(grid.domNode);

        /*Call startup() to render the grid*/
        grid.startup();

        dojo.connect(grid, "onRowClick", grid, function(evt){
            var idx = evt.rowIndex;
            var item = this.getItem(idx);

            dojo.byId("title").innerHTML = this.store.getValue(item, "title");
            dojo.byId("contents").innerHTML = this.store.getValue(item, "contents");
            dojo.byId("reference").innerHTML = this.store.getValue(item, "reference");
            dojo.byId("user_id").innerHTML = this.store.getValue(item, "user_id");
            dojo.byId("card_id").innerHTML = this.store.getValue(item, "id");
            dojo.byId("created").innerHTML = this.store.getValue(item, "created");
            var image_src = "./screenshot/" + this.store.getValue(item, "screenshot");
            console.log(image_src);
            node = dojo.byId("screenshot");
            console.log(dojo.getAttr(node, "src"));
            dojo.setAttr(node, "src", image_src);
        });
        dojo.on(dojo.byId("query_string"), "keydown", function(event) {
            if (event.keyCode == dojo.keys.ENTER) {
                var grid = dijit.byId("grid");
                var query = dojo.byId('query_string').value;
                grid.setFilter({ type: 'string', column: 'anycolumn', condition: 'contains', value: query });
            }
        })
//        dojo.on(dojo.byId("filter_button"), "click", filter);
        dojo.on(dojo.byId("reset_button"), "click", reset_filter);
        dojo.byId("query_string").value = "";
    });
})
