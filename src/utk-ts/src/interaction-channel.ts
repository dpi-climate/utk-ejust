import { GrammarMethods } from './grammar-methods';
import { Environment } from './environment';

export class InteractionChannel {

    static getGrammar: Function;
    static modifyGrammar: Function;
    static modifyGrammarVisibility: Function;
    static modifyTime: Function;

    static setModifyGrammarVisibility(modifyGrammar: Function): void {
        InteractionChannel.modifyGrammarVisibility = modifyGrammar;
    }

    static getModifyGrammarVisibility(): Function{
        return InteractionChannel.modifyGrammarVisibility;
    }

    static setModifyTime(setTime: Function){
        InteractionChannel.modifyTime = setTime;
    }

    static getModifyTime(){
        return InteractionChannel.modifyTime;
    }

    static sendData(variable: {name: string, value: any}): void {

        const url = `${Environment.backend}`;

        let grammar = GrammarMethods.grammar;

        if(grammar != undefined){
            if(grammar.variables) {
                for(let varr of grammar.variables) {
                    if(varr.name == variable.name) {
                        varr.value = variable.value;
                    }
                }
            }

            GrammarMethods.applyGrammar(url, grammar, "InteractionChannel", () => {});
        }
        
    }
}
