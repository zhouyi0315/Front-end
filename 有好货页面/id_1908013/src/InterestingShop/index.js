import create from './../create'
import style from './style.css'
import Img from './../Img'

const PROPERTY_SYMBOL = Symbol('property')
const ATTRIBUTE_SYMBOL = Symbol('attribute')
const EVENT_SYMBOL = Symbol('event')
const STATE_SYMBOL = Symbol('state')

export default class InterestingShop {
    constructor () {
        this[PROPERTY_SYMBOL] = Object.create(null)
        this[ATTRIBUTE_SYMBOL] = Object.create(null)
        this[EVENT_SYMBOL] = Object.create(null)
        this[STATE_SYMBOL] = Object.create(null)

        this[PROPERTY_SYMBOL].children = []

        this.created()
    }
    created () {
        this.root = document.createDocumentFragment('div')
        // this.render().appendTo(this.root)
    }
    render () {
        let data = this.getAttribute('data')
        let isReverse = this.getAttribute('reverse')
        return <div style={{...style.box, justifyContent: 'space-between', flexDirection: isReverse ? 'row-reverse' : 'row'}}>
            <div style={style.largeContainer}>
                <Img src={data.items[0].image} style={style.image}/>
                <div style={style.banner}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                <div style={style.smallContainer}>
                    <Img src={data.items[1].image} style={style.image}/>
                </div>
                <div style={style.smallContainer}>
                    <Img src={data.items[2].image} style={style.image}/>
                </div>
            </div>
        </div>
    }
    mounted() {

    }
    unmounted () {}
    update () {}
    appendTo (element) {
        element.appendChild(this.root)
        this.mounted()
    }
    get children () {
        return this[PROPERTY_SYMBOL].children
    }
    getAttribute (name) {
        return this[ATTRIBUTE_SYMBOL][name]
    }
    setAttribute (name , value) {
        this[ATTRIBUTE_SYMBOL][name] = value
        if (name === 'style') {
            this.root.setAttribute('style', value)
        }
        if (name === 'data') {
            this[ATTRIBUTE_SYMBOL][name] = value
            this.root.innerHTML = ''
            this.render().appendTo(this.root)
            return value
        }
    }
    appendChild (child) {
        this.children.push(child)
        child.appendChild(this.root)
    }
    addEventListener (type, listener) {
        if (this[EVENT_SYMBOL][type]) {
            this[EVENT_SYMBOL][type] = new Set()
            this[EVENT_SYMBOL][type].add(listener)
        }
        this[EVENT_SYMBOL][type] = listener
    }
    removeEventListener (type, listener) {
        if (!this[EVENT_SYMBOL][type]) {
            return
        }
        this[EVENT_SYMBOL][type].delete(listener)
    }
    triggerEvent (type) {
        for (let event of this[EVENT_SYMBOL][type]) {
            event.call(this)
        }
    }
}
