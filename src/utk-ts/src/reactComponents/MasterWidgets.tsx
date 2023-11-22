import React from "react";
import {Row} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartSimple, faCode } from '@fortawesome/free-solid-svg-icons'
import { GenericScreenPlotContainer } from "./GenericScreenPlotContainer";
import { GrammarType } from "../constants";

type MasterWidgetsProps = {
    width: number,
    height: number,
    genericPlots: any,
    togglePlots: any,
    editGrammar: any
}

export var GrammarPanelVisibility = true;
export const MasterWidgets = ({width, height, genericPlots, togglePlots, editGrammar}:MasterWidgetsProps) =>{

    const handleTogglePlots = (e: any) => {
      togglePlots();
    }

    return (
        <React.Fragment>
            <Row>
                <div style={{zIndex: 5, backgroundColor: "white", width: "75px", position: "absolute", left: "10px", top: "10px", padding: "5px", borderRadius: "8px", border: "1px solid #dadce0", opacity: 0.9, boxShadow: "0 2px 8px 0 rgba(99,99,99,.2)"}}>
                    <FontAwesomeIcon size="2x" style={{color: "#696969", padding: 0, marginTop: "5px", marginBottom: "5px"}} icon={faCode} onClick={() => editGrammar("grammar", GrammarType.MASTER)} />
                    {genericPlots.filter((plot: any) => {return plot.floating;}).length > 0 ? 
                        <FontAwesomeIcon size="2x" style={{color: "#696969", padding: 0, marginTop: "5px", marginBottom: "5px"}} icon={faChartSimple} onClick={handleTogglePlots} />
                        : null}
                </div>
            </Row>
          {
            genericPlots.map((item: any) => {
                if(item.floating){
                return (
                    <GenericScreenPlotContainer
                        id={item.id}
                        disp = {!item.hidden}
                        svgId={item.svgId}
                        x={height/2}
                        y={width/2}
                        knotsByPhysical={item.knotsByPhysical}
                    />
                )
                }else{
                    return null;
                }
            })
        }
        </React.Fragment>
    );
}