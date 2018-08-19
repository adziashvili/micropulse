const DEF_LAYOUT = {
    indent: "  ",
    padding: 3,
    firstColWidth: 10,
    cols: [],
    rows: [],
    totalSeperator: "  | "
}

export default class Layout {

    constructor( {
        indent = DEF_LAYOUT.indent,
        padding = DEF_LAYOUT.padding,
        firstColWidth = DEF_LAYOUT.firstColWidth,
        cols = DEF_LAYOUT.cols,
        rows = DEF_LAYOUT.rows,
        totalSeperator = DEF_LAYOUT.totalSeperator
    } = {} ) {
        this.indent = indent
        this.padding = padding
        this.firstColWidth = firstColWidth
        this.cols = cols
        this.rows = rows
        this.totalSeperator = totalSeperator
    }

    /**
     * Recalculates the layout based on a model.
     * Assumes that cols and rows will depict the high level structure.
     *
     * Colunm length is not changed and is assumed to be 10 char in length.
     *
     * @param {Modeler} modeler The modeler used to build the model
     */
    rebuild( modeler ) {

        let { model } = modeler
        let max = 0

        // Calculating row max
        let aspects = modeler.describeAspects( 'rows' )
        aspects.forEach( ( a, i ) => {
            max = Math.max( max, a.maxStringLength + i * this.indent.length )
        } )
        this.firstColWidth = Math.max( max + this.padding, this.firstColWidth )
        this.rows = aspects

        // Calculating cols layout data
        aspects = modeler.describeAspects( 'cols' )
        aspects.forEach( ( a ) => {
            a.maxStringLength = Math.max( a.maxStringLength + this.padding, a.key.length + this.padding )
        } )
        for ( let i = 0; i < aspects.length; i++ ) {
            aspects[ i ].layoutLength = aspects[ i ].maxStringLength
            if ( ( i + 1 ) < aspects.length ) {
                aspects[ i ].layoutLength = Math.max( aspects[ i ].layoutLength, aspects[ i + 1 ].maxStringLength *
                    aspects[ i + 1 ].count )
            }
        }
        this.cols = aspects
    }
}
