/// <reference types="@types/webgl2" />

import { CameraFactory } from './camera';
import { Layer } from './layer';

import { MapStyle } from './map-style';

import { KeyEventsFactory } from './key-events';
import { MouseEventsFactory } from './mouse-events';

import { DataApi } from './data-api';
import { LayerManager } from './layer-manager';

import { ICameraData, ILayerData, IMasterGrammar } from './interfaces';

import { LevelType, PlotArrangementType } from './constants';

import { ShaderPicking } from "./shader-picking";
import { ShaderPickingTriangles } from "./shader-picking-triangles";

import { PlotManager } from "./plot-manager";
import { KnotManager } from './knot-manager';
import { Knot } from './knot';

class MapView {
    // Html div that will host the map
    protected _mapDiv: HTMLElement;
    // Html canvas used to draw the map
    protected _canvas: HTMLCanvasElement;
    // WebGL context of the canvas
    public _glContext: WebGL2RenderingContext;

    protected _layerManager: LayerManager;
    protected _knotManager: KnotManager;

    // Manages the view configuration loaded (including plots and its interactions)
    protected _plotManager: PlotManager; // plot manager for local embedded plots

    protected _grammarInterpreter: any;

    protected _updateStatusCallback: any;

    // interaction variables
    private _camera: any;
    // mouse events
    private _mouse: any;
    // keyboard events
    private _keyboard: any;

    private _knotVisibilityMonitor: any;

    // private _mapViewData: IGrammar;

    protected _embeddedKnots: Set<string>;
    protected _linkedKnots: Set<string>;

    public _viewId: number; // the view to which this map belongs

    resetMap(grammarInterpreter: any, layerManager: LayerManager, knotManager: KnotManager, viewId:number): void {
        this._grammarInterpreter = grammarInterpreter;
        this._layerManager = layerManager;
        this._knotManager = knotManager;
        this._viewId = viewId;
    }

    get layerManager(): LayerManager {
        return this._layerManager;
    }

    get knotManager(): KnotManager{
        return this._knotManager;
    }

    get mouse(): any{
        return this._mouse;
    }

    get viewId(): number{
        return this._viewId;
    }

    /**
     * gets the map div
     */
    get div(): HTMLElement {
        return this._mapDiv;
    }

    /**
     * gets the canvas element
     */
    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    /**
     * gets the opengl context
     */
    get glContext(): WebGL2RenderingContext {
        return this._glContext;
    }

    /**
     * gets the camera object
     */
    get camera(): any {
        return this._camera;
    }

    get plotManager(): PlotManager{
        return this._plotManager;
    }

    updateTimestep(message: any, _this: any): void {
        for(const knot of _this._knotManager.knots){
            if(knot.id == message.knotId){
                knot.updateTimestep(message.timestep, message.mapId);
            }
        }

        _this.render();
    }

    /**
     * Map initialization function
     */
    async init(mapDivId: string, updateStatusCallback: any): Promise<void> {

        let mapDiv: any = <HTMLElement>document.getElementById(mapDivId)

        if(mapDiv == null){
            return;
        }

        mapDiv.innerHTML = "";

        this._mapDiv = mapDiv;
        this._canvas = document.createElement('canvas');
        this._canvas.id = mapDiv.id+"_mapCanvas";
        this._canvas.className = "mapView";
        this._glContext = <WebGL2RenderingContext>this._canvas.getContext('webgl2', {preserveDrawingBuffer: true, stencil: true}); // preserve drawing buffer is used to generate valid blobs for the cave
        this._mapDiv.appendChild(this._canvas);

        this._updateStatusCallback = updateStatusCallback;

        if(this._knotVisibilityMonitor){
            clearInterval(this._knotVisibilityMonitor);
        }

        // inits the mouse events
        this.initMouseEvents();

        // inits the keyboard events
        this.initKeyboardEvents();

        this.monitorKnotVisibility();

        await this.initCamera(this._grammarInterpreter.getCamera(this._viewId));

        // resizes the canvas
        this.resize();

        // await this.initLayers();
        
        // this.initKnots();

        // let knotsGroups: any = {};

        // for(const knot of this._knotManager.knots){
            
        //     let knotSpecification = knot.knotSpecification;
            
        //     if(knotSpecification.group != undefined){
        //         if(!(knotSpecification.group.group_name in knotsGroups)){
        //             knotsGroups[knotSpecification.group.group_name] = [{
        //                 id: knot.id,
        //                 position: knotSpecification.group.position
        //             }];
        //         }else{
        //             knotsGroups[knotSpecification.group.group_name].push({
        //                 id: knot.id,
        //                 position: knotSpecification.group.position
        //             });
        //         }
        //     }else{
        //         knotsGroups[knot.id] = [knot.id]; // group of single knot
        //     }
            
        // }

        // for(const group of Object.keys(knotsGroups)){
        //     if(knotsGroups[group].length > 1){
        //         knotsGroups[group].sort((a: any,b: any) => {a.position - b.position});
        //         let ids = [];
        //         for(const element of knotsGroups[group]){
        //             ids.push(element.id);
        //         }
        //         knotsGroups[group] = ids;
        //     }
        // }
        
        // this._updateStatusCallback("listLayers", knotsGroups);

        this.initPlotManager();

        if(this._grammarInterpreter.getFilterKnots(this._viewId) != undefined){
            this._layerManager.filterBbox = this._grammarInterpreter.getFilterKnots(this._viewId);
        }else{
            this._layerManager.filterBbox = [];
        }

        updateStatusCallback("subscribe", {id: "mapview"+this._viewId, channel: "updateTimestepKnot", callback: this.updateTimestep, ref: this});

        this.render();
    }

    updateGrammarPlotsData(){

        let plotsKnotData = this._grammarInterpreter.parsePlotsKnotData(this._viewId); // only parse plots knot data that belongs to this mapview

        this._plotManager.updateGrammarPlotsData(plotsKnotData);

    }
 
    // if clear == true, elements and level are ignored and all selections are deactivated
    updateGrammarPlotsHighlight(layerId: string, level: LevelType | null, elements: number[] | null, clear: boolean = false){

        if(!clear && elements != null){
            for(const elementIndex of elements){
                let elementsObject: any = {};
            
                for(const knot of this._grammarInterpreter.getKnots()){
                    let lastLink = this._grammarInterpreter.getKnotLastLink(knot);
        
                    if(lastLink.out.name == layerId && lastLink.out.level == level){
                        elementsObject[knot.id] = elementIndex;
                    }

                }

                this.plotManager.applyInteractionEffectsLocally(elementsObject, true, true, true); // apply to the local plot manager
                this._grammarInterpreter.plotManager.applyInteractionEffectsLocally(elementsObject, true, true, true); // apply to the global plot manager
                // this.plotManager.setHighlightElementsLocally(elements, true, true);
                // this.plotManager.setFilterElementsLocally(elements)
            }
        }else{
            let knotsToClear: string[] = [];

            for(const knot of this._grammarInterpreter.getKnots()){
                let lastLink = this._grammarInterpreter.getKnotLastLink(knot);
    
                if(lastLink.out.name == layerId){
                    knotsToClear.push(knot.id);
                }
            }

            // this.plotManager.clearHighlightsLocally(knotsToClear);
            this.plotManager.clearInteractionEffectsLocally(knotsToClear); // apply to the local plot manager
            this._grammarInterpreter.plotManager.clearInteractionEffectsLocally(knotsToClear);  // apply to the global plot manager
        }

    }

    initPlotManager(){
        this._plotManager = new PlotManager("PlotManagerMap"+this._viewId, this._grammarInterpreter.getPlots(this._viewId), this._grammarInterpreter.parsePlotsKnotData(this._viewId), {"function": this.setHighlightElement, "arg": this});
        this._plotManager.init(this._updateStatusCallback);
    }

    //TODO: not sure if mapview should contain this logic
    setHighlightElement(knotId: string, elementIndex: number, value: boolean, _this: any){

        let knot = _this._grammarInterpreter.getKnotById(knotId);

        if(knot == undefined){
            throw Error("Cannot highlight element knot not found");
        }

        let layerId = _this._grammarInterpreter.getKnotOutputLayer(knot);

        let lastLink = _this._grammarInterpreter.getKnotLastLink(knot);

        if(lastLink.out.level == undefined)
            return;

        let knotObject = _this.knotManager.getKnotById(knotId);

        let shaders = knotObject.shaders[_this.viewId];

        // not sure if layer should be accessed directly or knot.ts be used
        for(const layer of _this._layerManager.layers){
            if(layer.id == layerId){
                layer.setHighlightElements([elementIndex], <LevelType>lastLink.out.level, value, shaders, _this._camera.getWorldOrigin(), _this.viewId);
                break;
            }
        }

        _this.render();

    }

    toggleKnot(id:string, value: boolean | null = null){
        this._knotManager.toggleKnot(id, value);
        this.render();
    }

    /**
     * Camera initialization function
     * @param {string | ICameraData} data Object containing the camera. If data is a string, then it loads data from disk.
     */
    async initCamera(camera: ICameraData | string): Promise<void> {
        // load the index file and its layers
        const params = typeof camera === 'string' ? await DataApi.getCameraParameters(camera) : camera;

        // sets the camera
        this._camera = CameraFactory.getInstance();
        this._camera.resetCamera(params.position, params.direction.up, params.direction.lookAt, params.direction.right, this._updateStatusCallback);
    }

    /**
     * Inits the mouse events
     */
    initMouseEvents(): void {
        // creates the mouse events manager
        this._mouse = MouseEventsFactory.getInstance();
        this._mouse.setMap(this);

        // binds the mouse events
        this._mouse.bindEvents();
    }

    /**
     * Inits the mouse events
     */
    initKeyboardEvents(): void {
        // creates the mouse events manager
        this._keyboard = KeyEventsFactory.getInstance();
        this._keyboard.setMap(this);
    }

    public setCamera(camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}): void{
        this._camera.setPosition(camera.position[0], camera.position[1]);
        this.render();
    }   

    /**
     * Renders the map
     */
    render(): void {
        // no camera defined
        if (!this._camera) { return; }

        // sky definition
        const sky = MapStyle.getColor('sky').concat([1.0]);
        this._glContext.clearColor(sky[0], sky[1], sky[2], sky[3]);

        // tslint:disable-next-line:no-bitwise
        this._glContext.clear(this._glContext.COLOR_BUFFER_BIT | this._glContext.DEPTH_BUFFER_BIT);

        this._glContext.clearStencil(0);
        this._glContext.clear(this._glContext.STENCIL_BUFFER_BIT);

        // updates the camera
        this._camera.update();

        this._camera.loadPosition(JSON.stringify(this.camera));

        // // render the layers
        // for (const layer of this._layerManager.layers) {
        //     // skips based on visibility
        //     if (!layer.visible) { continue; }

        //     if(this._grammarInterpreter.evaluateLayerVisibility(layer.id, this._viewId)){
        //         // sends the camera
        //         layer.camera = this.camera;
        //         // render
        //         // layer.render(this._glContext);
        //     }
        // }

        for(const knot of this._knotManager.knots){

            if(this._grammarInterpreter.evaluateKnotVisibility(knot, this._viewId)){
                knot.render(this._glContext, this.camera, this._viewId);
            }

            // if(this._grammarInterpreter.evaluateKnotVisibility(knot, this._viewId)){
            //     if(!knot.visible)
            //         this._knotManager.toggleKnot(knot.id, true);
            //     knot.render(this._glContext, this.camera, this._viewId);
            // }else{
            //     if(knot.visible)
            //         this._knotManager.toggleKnot(knot.id, false);
            // }
        }

    }

    private monitorKnotVisibility(){
        let previousKnotVisibility: boolean[] = [];

        for(const knot of this._knotManager.knots){
            previousKnotVisibility.push(knot.visible);
        }

        let _this = this;

        this._knotVisibilityMonitor = window.setInterval(function(){
            for(let i = 0; i < _this._knotManager.knots.length; i++){
                let currentVisibility = _this._grammarInterpreter.evaluateKnotVisibility(_this._knotManager.knots[i], _this._viewId);

                // if visibility of some knot changed need to rerender the map
                if(previousKnotVisibility[i] != currentVisibility){
                    previousKnotVisibility[i] = currentVisibility;
                    _this.render();
                }

            }
        }, 100);
    }

    /**
     * Resizes the html canvas
     */
    resize(): void {

        const targetWidth = this._mapDiv.clientWidth;
        const targetHeight = this._mapDiv.clientHeight;

        const value = Math.max(targetWidth, targetHeight);
        // this._glContext.viewport(0, 0, value, value);
        this._glContext.viewport(0, 0, targetWidth, targetHeight);
        this._canvas.width = targetWidth;
        this._canvas.height = targetHeight;

        // stores in the camera
        this._camera.setViewportResolution(targetWidth, targetHeight);

        for (const knot of this._knotManager.knots){
            if (!knot.visible) { continue; }

            for(const shader of knot.shaders[this._viewId]){
                if(shader instanceof ShaderPicking){
                    shader.resizeDirty = true;
                }

                if(shader instanceof ShaderPickingTriangles){
                    shader.resizeDirty = true;
                }
            }
        }

        this.render();            
    }
}

export var MapViewFactory = (function(){

    var instance: MapView;
  
    return {
      getInstance: function(grammarInterpreter: any, layerManager: any, knotManager: any, viewId: number){
          if (instance == null) {
              instance = new MapView();
          }

          instance.resetMap(grammarInterpreter, layerManager, knotManager, viewId);
          return instance;
      }
    };
  
})();