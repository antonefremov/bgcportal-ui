// @ts-nocheck
sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/thirdparty/jquery",
	"../model/formatter"
], function (BaseController, JSONModel, History, jquery, formatter) {
	"use strict";

	return BaseController.extend("ns.HTML5Module.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page shows busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
					busy : true,
					delay : 0
				});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
	    onAfterRendering: function () {
			var oSplitCont = this.getView().byId("SplitContDemo"),
				ref = oSplitCont.getDomRef() && oSplitCont.getDomRef().parentNode;
			// set all parent elements to 100% height, this should be done by app developer, but just in case
			if (ref && !ref._sapUI5HeightFixed) {
				ref._sapUI5HeightFixed = true;
				while (ref && ref !== document.documentElement) {
					var $ref = jquery(ref);
					if ($ref.attr("data-sap-ui-root-content")) { // Shell as parent does this already
						break;
					}
					if (!ref.style.height) {
						ref.style.height = "100%";
					}
					ref = ref.parentNode;
				}
			}
		},

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function (oEvent) {
			this.sObjectId =  oEvent.getParameter("arguments").objectId;
            this._bindView("/MyRequests" + this.sObjectId);
           this._bindMasterList();
           this._bindEmploymentHistoryTable();
           
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("objectView");

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
        },
        
	    /**
		 * Binds the master panel list to the screening tasks.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
        _bindMasterList: function(sObjectId){
           var list = this.getView().byId("masterPageListID"),
         
           oItemTemplate = new sap.m.StandardListItem({
                   title:"{screeningTaskTypeDescription}",
                    description:"{screeningTaskTypeName}",
                    counter:"{completion}",
                    type : "Navigation"
                });
                
           list.bindItems({
               path:"/MyScreeningTask",
               template: oItemTemplate,
               parameters: {
					$filter: "candidateID eq " +  this.sObjectId
				}
           })
        },

        _navToDetailPage: function(oEvent){
            var splitApp =  this.getView().byId("SplitContDemo");
          
            var sListItemtitle = oEvent.getParameters().listItem.getTitle()
            switch(sListItemtitle){
            case "Employment History":
                  splitApp.toDetail(this.createId("EmploymentHistorydetailPage"));
                  this._bindEmploymentHistoryTable();
                  break;
            case "Drug Use Test":
                  splitApp.toDetail(this.createId("DrugUseTestDetailPage"));
                  this._bindDrugUseTestTable();
                  break;
            }
        },
       
        _bindEmploymentHistoryTable: function(){
          
           var oTable = this.getView().byId("idEmployementHistoryTable");           
                oTable.bindItems({
                     path:"/EmploymentHistory",
                     template: new sap.m.ColumnListItem({
						  cells:[             
                                new sap.m.ObjectIdentifier({title:"{employer}"}),
                                new sap.m.Text({text:"{designation}"}),
                                new sap.m.Text({text:"{ctc}"}),
                                new sap.m.Text({text:"{email}"}),
                                new sap.m.Text({text:"{phone}"}),
                                new sap.m.Text({text:""}),                              
                                new sap.m.Text({text:""})
							 ]
						  }),
                     templateShareable: true,
                     parameters: {
                      $filter: "screeningTask_ID eq " +  this.sObjectId //to-do : change data model to take candidate id as filter 
                                                                         //and not screening task as I am passing candidate id as value
                    }
                 });
            
        },
        
        _bindDrugUseTestTable: function(){
                var oTable = this.getView().byId("idDrugUseTestTable");      
                oTable.bindItems({
                    path:"/DrugUseType",
                    template: new sap.m.ColumnListItem({
						  cells:[             
                                new sap.m.ObjectIdentifier({title:"{drugType}"}),
                                new sap.m.Text({text:""}),
                                new sap.m.Text({text:""}),
                                new sap.m.Text({text:""}),
                                new sap.m.Text({text:"{testResult}"}),
                                new sap.m.Text({text:""}),
                                new sap.m.Text({text:""})
							 ]
						  }),
                    templateShareable: true,
                     parameters: {
                           $filter: "screeningTask_ID eq " +  this.sObjectId //to-do : change data model to take candidate id as filter 
                                                                             //and not screening task as I am passing candidate id as value
                     }
                });
        },

		_onBindingChange : function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle();

			oView.getBindingContext().requestObject().then((function (oObject) {
				var sObjectId = oObject.ID,
					sObjectName = oObject.candidate_ID;


				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
			}).bind(this));
		}

	});

});