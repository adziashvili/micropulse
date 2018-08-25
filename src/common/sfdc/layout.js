const DEF_LAYOUT = {
    indent: "  ",
    padding: 3,
    firstColWidth: 10,
    totalSeperator: "   | ",
    cols: [],
    rows: [],
    lengths: []
}

export default class Layout {

    constructor( {
        indent = DEF_LAYOUT.indent,
        padding = DEF_LAYOUT.padding,
        firstColWidth = DEF_LAYOUT.firstColWidth,
        totalSeperator = DEF_LAYOUT.totalSeperator,
        cols = DEF_LAYOUT.cols,
        rows = DEF_LAYOUT.rows,
        lengths = DEF_LAYOUT.lengths,
    } = {} ) {
        this.indent = indent
        this.padding = padding
        this.firstColWidth = firstColWidth
        this.totalSeperator = totalSeperator
        this.cols = cols
        this.rows = rows
        this.lengths = lengths
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
                aspects[ i ].layoutLength = Math.max(
                    aspects[ i ].layoutLength,
                    aspects[ i + 1 ].maxStringLength * aspects[ i + 1 ].count )
            }
        }
        this.cols = aspects

        this.cols.forEach( ( col, i ) => {
            this.lengths.push( this.getRowLengths( i ) )
        } )

        let lastLevelLengths = this.lengths[ this.lengths.length - 1 ]
        let customRowsHeaderLengths = modeler.custom.map( ( c ) => {
            return this.indent.length * this.lengths.length + c.key.length
        } )
        lastLevelLengths[ 0 ] = Math.max( lastLevelLengths[ 0 ], ...customRowsHeaderLengths )
        this.firstColWidth = lastLevelLengths[ 0 ]
        //lastly adjust for custom keys
    }

    /**
     * Returns the lengths of all the values for a sepecfic nesting level.
     *
     * @param {Number}  [nestingLevel=0]  The colunm index in the cols array.
     * @param {Boolean} [isAddTotal=true] If true, adds total.
     *
     * @return {[type]}  [description]
     */
    getRowLengths( nestingLevel = 0, isAddTotal = true ) {
        return this.getHeaders( nestingLevel, isAddTotal ).map( ( i ) => {
            return i.length
        } )
    }

    /**
     * Returns an array of all header values and their respective layout length.
     *
     * Each value will be represented with an object in the returned array with
     * value and length properties e.g. {value: 'v', lenght: 6}.
     *
     * The first entry value is set to "".
     *
     * Depending on the nesting level, the values are repeated to form a complete
     * line in STDOUT. For example, for nesting level 1 the values will be repeated
     * twice, for nesting level 2, 3 times.
     *
     * The first row and total at the end are no reepeated.
     *
     * @param {Number}  [nestingLevel=0]  The colunm index in the cols array.
     * @param {Boolean} [isAddTotal=true] If true, adds total.
     *
     * @return {[type]}  [description]
     */
    getHeaders( nestingLevel = 0, isAddTotal = true ) {

        let { cols, firstColWidth } = this
        let lens = []

        if ( nestingLevel >= cols.length ) {
            console.log( "Warnings: Invalid nesting level" );
            return lens
        }

        lens.push( { value: "", length: firstColWidth } )
        let col = cols[ nestingLevel ]

        for ( let i = 0; i < nestingLevel + 1; i++ ) {
            col.distinctValues.forEach( ( v ) => {
                lens.push( { value: v, length: col.layoutLength } )
            } )
        }

        if ( isAddTotal ) {
            lens.push( { value: "TOTAL", length: cols[ cols.length - 1 ].layoutLength } )
        }

        return lens
    }

    /**
     * Returns nesting time indent.
     *
     * @param {Number} [nesting=0] Nesting level.
     *                             This is used to calculate the times the
     *                             nesting will be replicatad.
     *
     * @return {String} Indent string.
     */
    nestedIndent( nesting = 0 ) {
        let nested = ""
        for ( let i = 0; i < nesting; i++ ) {
            nested += this.indent
        }
        return nested
    }
}
