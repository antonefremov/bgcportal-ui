// @ts-nocheck
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/thirdparty/jquery",
    "../model/formatter"
], function (BaseController, JSONModel, History, jquery, formatter) {
    "use strict";

    return BaseController.extend("ns.HTML5Module.controller.LoginPage", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            // var oViewModel = new JSONModel({
            //     busy: true,
            //     delay: 0
            // });
            // this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            // this.setModel(oViewModel, "objectView");
            // this.oController = this;
            // this._pdfViewer = new sap.m.PDFViewer();;
            // this.getView().addDependent(this._pdfViewer);
        },
        OnSignInButtonPress: function(){     
            var user = this.getView().byId("userInputId").getValue();   
            var password = this.getView().byId("passwordInputId").getValue(); 
            if(user === "Dummy" && password === "Welcome"){
               this.getRouter().navTo("worklist");
            }else{
                new sap.m.MessageBox.error("Sign In Failed, please try again!");
            }  
           
        }

    });

});