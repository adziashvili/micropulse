export default class JSONHelper {

    /**
     * Deep clones an object via JSON serialization and deserialization.
     *
     * @param {object} obj Object to deep clone
     *
     * @return {object} Deep copy of object
     */
    static deepClone( obj ) {
        return JSON.parse( JSON.stringify( obj ) )
    }

    /**
     * Converts an object to json string
     *
     * @param {object}  obj           Object to stringify
     * @param {Boolean} [pretty=true] If true, string pretified
     *
     * @return {[type]}  [description]
     */
    static stringify( obj, pretty = true ) {
        return pretty ?
            JSON.stringify( JSON.parse( JSON.stringify( obj ) ), null, 2 ) :
            JSON.stringify( obj )
    }
}
