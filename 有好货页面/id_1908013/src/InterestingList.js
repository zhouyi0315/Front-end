import create from './create'
import InterestingShop from './InterestingShop'
const PROPERTY_SYMBOL = Symbol('property')
const ATTRIBUTE_SYMBOL = Symbol('attribute')
const EVENT_SYMBOL = Symbol('event')
const STATE_SYMBOL = Symbol('state')

export default class InterestingList {
    constructor (config) {
        this.property = 1
        this[PROPERTY_SYMBOL] = Object.create(null)
        this[ATTRIBUTE_SYMBOL] = Object.create(null)
        this[EVENT_SYMBOL] = Object.create(null)
        this[STATE_SYMBOL] = Object.create(null)
        this[PROPERTY_SYMBOL].children = []
        this.created()
    }

    appendTo (element) {
        element.appendChild(this.root)
        this.mounted()
    }
    created () {
        this.root = document.createDocumentFragment('div')
    }
    render() {
        let data = this.getAttribute('data')
        let recommendedShops = data['recommendedShops']
        console.log(recommendedShops, '--------recommendShops-----')
        return <div>
            {recommendedShops.map((item, index) => <InterestingShop reverse={index % 2 !== 0} data={item} />)}
        </div>
    }
    mounted () {

    }

    unmounted () {

    }

    update () {

    }
    appendChild (child) {
        this.children.push(child)
        child.appendChild(this.root)
    }
    get children () {
        return this[PROPERTY_SYMBOL].children
    }
    getAttribute (name) {
        return this[ATTRIBUTE_SYMBOL][name]
    }
    setAttribute (name, value) {
        if (name === 'width') {
            this.width = value
        }
        if (name === 'className') {
            this.root.setAttribute('class', value)
        }
        if (name === 'data') {
            this[ATTRIBUTE_SYMBOL][name] = value
            this.root.innerHTML = ''
            this.render().appendTo(this.root)
            return value
        }
        return this[ATTRIBUTE_SYMBOL][name] = value
    }
    addEventListener (type, listener) {
        if (!this[EVENT_SYMBOL][type]) {
            this[EVENT_SYMBOL][type] = new Set()
            this[EVENT_SYMBOL][type].add(listener)
        }
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
