import { IGrammar } from './interfaces';

export class GrammarMethods {

    static grammar: IGrammar;

    static subscribers: any = {};

    static applyGrammar(url_string: string | undefined, grammar: Object): Promise<any> {

        let url = "http://localhost:5001";

        console.log("here is my new grammar", JSON.stringify({"grammar": grammar}));

        if(url_string != undefined){
            url = url_string;
        }

        let fetch_promise = fetch(url+"/updateGrammar", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"grammar": grammar})
        })

        fetch_promise.then((reponse) => {
            for(const [key, value] of Object.entries(GrammarMethods.subscribers)){
                console.log("calling subscribed functions", grammar);
                (<Function>value)(grammar);
            }
        })

        return fetch_promise;
    }

    static subscribe(identifier: string, subscription_callback: Function){
        console.log("Called subscribe", identifier);
        GrammarMethods.subscribers[identifier] = subscription_callback;
    }

    static updateGrammar(data: IGrammar): void {
        GrammarMethods.grammar = data;
    }

}
