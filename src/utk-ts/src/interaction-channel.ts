import { GrammarMethods } from './grammar-methods';
import { Environment } from './environment';

export class InteractionChannel {

    static getGrammar: Function;
    static modifyGrammar: Function;
    static modifyGrammarVisibility: Function;

    static setModifyGrammarVisibility(modifyGrammar: Function): void {
        InteractionChannel.modifyGrammarVisibility = modifyGrammar;
    }

    static getModifyGrammarVisibility(): Function{
        return InteractionChannel.modifyGrammarVisibility;
    }

    static sendData(variable: {name: string, value: any}): void {

        const url = `${Environment.backend}`;

        console.log("sendData 1", variable);

        let grammar = GrammarMethods.grammar;

        if(grammar != undefined){
            console.log("sendData 2", grammar);
            if(grammar.variables) {
                for(let varr of grammar.variables) {
                    if(varr.name == variable.name) {
                        varr.value = variable.value;
                    }
                }
            }
            // grammar.grammar_position = {
            //     "width": [
            //         1,
            //         2
            //     ],
            //     "height": [
            //         2,
            //         4
            //     ]
            // };
            // console.log("here is my previous apply grammar", JSON.stringify(grammar));
            console.log("sendData 3", grammar);
            GrammarMethods.applyGrammar(url, grammar);
        }
        
    }
}
