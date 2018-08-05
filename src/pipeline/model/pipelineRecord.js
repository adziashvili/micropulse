import { DateHelper, StringHelper } from '../../common'

const EMPTY = ""

export default class PipelineRecord {

    constructor( [
        practice = EMPTY,
        closeDate = null,
        customer = EMPTY,
        opportunity = EMPTY,
        forecast = EMPTY,
        value = 0,
        ir = 0,
        ai = 0,
        duration = 0,
        probablity = 0,
        owner = EMPTY,
        stage = EMPTY,
        pa = false
    ] ) {
        this.practice = practice
        this.closeDate = closeDate
        this.customer = customer
        this.opportunity = opportunity
        this.value = value
        this.stage = stage
        this.forecast = forecast
        this.ir = ir
        this.ai = ai
        this.duration = duration
        this.probablity = probablity
        this.owner = owner
        this.pa = pa
    }

    set practice( name ) {
        this._practice = name
    }

    get practice() {
        return this._practice
    }

    set closeDate( closeDateString ) {
        this._closeDate = new DateHelper( closeDateString ).date
    }

    get closeDate() {
        return this._closeDate
    }

    set customer( customerName ) {
        this._customer = customerName
    }

    get customer() {
        return this._customer
    }

    set opportunity( opportunityName ) {
        this._opportunity = opportunityName
    }

    get opportunity() {
        return this._opportunity
    }

    set value( v ) {
        this._value = StringHelper.parseNumber( v )
    }

    get value() {
        return this._value
    }

    set stage( stage ) {
        this._stage = stage
    }

    get stage() {
        return this._stage
    }

    set forecast( forecast ) {
        this._forecast = forecast
    }

    get forecast() {
        return this._forecast
    }

    set ir( ir ) {
        this._ir = StringHelper.parseNumber( ir )
    }

    get ir() {
        return this._ir
    }

    set ai( ai ) {
        this._ai = StringHelper.parseNumber( ai )
    }

    get ai() {
        return this._ai
    }

    set duration( duration ) {
        this._duration = StringHelper.parseNumber( duration )
    }

    get duration() {
        return this._duration
    }

    set probablity( probablity ) {
        this._probablity = StringHelper.parsePercent( probablity )
    }

    get probablity() {
        return this._probablity
    }

    set owner( owner ) {
        this._owner = owner
    }

    get owner() {
        return this._owner
    }

    set pa( pa ) {
        this._pa = StringHelper.parseBoolean( pa )
    }

    get pa() {
        return this._pa
    }

    clone() {
        return new PipelineRecord(
            this.practice,
            this.closeDate,
            this.customer,
            this.opportunity,
            this.value,
            this.stage,
            this.forecast,
            this.ir,
            this.ai,
            this.duration,
            this.probablity,
            this.owner,
            this.pa
        )
    }

}
