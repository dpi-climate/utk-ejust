import { GrammarMethods } from './grammar-methods';

export class InteractionChannel {
    /**
     * Loads blablabla
     * @param {Function} myString blabla
     * @return { any } bla
     */

    static getGrammar: Function;
    static modifyGrammar: Function;

    static sendData(data: {variable: string, value: any}): void {

        const url = process.env.REACT_APP_BACKEND_SERVICE_URL;

        console.log("time", data);

        let grammar = GrammarMethods.grammar;

        if(grammar != undefined){
            grammar.grammar_position = {
                "width": [
                    1,
                    2
                ],
                "height": [
                    1,
                    4
                ]
            }
    
            GrammarMethods.applyGrammar(url, {"grammar": JSON.stringify(grammar)})
        }

    }
}
