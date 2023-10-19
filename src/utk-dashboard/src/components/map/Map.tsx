import { useEffect } from 'react';
import {Environment, DataLoader, GrammarInterpreterFactory, InteractionChannel} from 'utk';
// import {Environment, DataLoader, GrammarInterpreterFactory} from 'utk';
import $ from 'jquery';
import { IGrammar } from 'utk';

interface MapProps {
  time: number,
  setTime: (time: number) => void
}

const Map = ({ time, setTime } : MapProps) => {
  
  // Run only once
  useEffect(() => {
    const createAndRunMap = async () => {
      $('#spatial-div').empty();
      
      // Serves data files to the map
      Environment.setEnvironment({backend: Environment.backend});
      
      const url = `${Environment.backend}/getGrammar`;
      const grammar = await DataLoader.getJsonData(url) as IGrammar;

      const currentTime = parseInt(grammar.variables[0].value);
      if(currentTime>0 && currentTime<11) setTime(currentTime);
      const mainDiv = document.querySelector('#spatial-div') as HTMLElement;

      const setTimeFunction = setTime;

      const grammarInterpreter = GrammarInterpreterFactory.getInstance();
      grammarInterpreter.resetGrammarInterpreter(grammar, mainDiv, setTimeFunction);
    }
    createAndRunMap();

  }, []);

  useEffect(() => {
    InteractionChannel.sendData({name: "timestep", value: ""+time})
  }, [time]);

  // return <div id='spatial-div' style={{height: "100vh", width: "100%"}}></div>
  return <div id='spatial-div' style={{ height: "90vh",width: "100%"}}></div>
}

export { Map }