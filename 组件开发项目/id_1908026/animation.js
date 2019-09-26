function cubicBezier(p1x, p1y, p2x, p2y) {
  const ZERO_LIMIT = 1e-6;
  // Calculate the polynomial coefficients,
  // implicit first and last control points are (0,0) and (1,1).
  const ax = 3 * p1x - 3 * p2x + 1;
  const bx = 3 * p2x - 6 * p1x;
  const cx = 3 * p1x;

  const ay = 3 * p1y - 3 * p2y + 1;
  const by = 3 * p2y - 6 * p1y;
  const cy = 3 * p1y;

  function sampleCurveDerivativeX(t) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner 's rule.
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  function sampleCurveX(t) {
    return ((ax * t + bx) * t + cx) * t;
  }

  function sampleCurveY(t) {
    return ((ay * t + by) * t + cy) * t;
  }

  // Given an x value, find a parametric value it came from.
  function solveCurveX(x) {
    var t2 = x;
    var derivative;
    var x2;

    // https://trac.webkit.org/browser/trunk/Source/WebCore/platform/animation
    // First try a few iterations of Newton's method -- normally very fast.
    // http://en.wikipedia.org/wiki/Newton's_method
    for (let i = 0; i < 8; i++) {
      // f(t)-x=0
      x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < ZERO_LIMIT) {
        return t2;
      }
      derivative = sampleCurveDerivativeX(t2);
      // == 0, failure
      /* istanbul ignore if */
      if (Math.abs(derivative) < ZERO_LIMIT) {
        break;
      }
      t2 -= x2 / derivative;
    }

    // Fall back to the bisection method for reliability.
    // bisection
    // http://en.wikipedia.org/wiki/Bisection_method
    var t1 = 1;
    /* istanbul ignore next */
    var t0 = 0;

    /* istanbul ignore next */
    t2 = x;
    /* istanbul ignore next */
    while (t1 > t0) {
      x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < ZERO_LIMIT) {
        return t2;
      }
      if (x2 > 0) {
        t1 = t2;
      } else {
        t0 = t2;
      }
      t2 = (t1 + t0) / 2;
    }

    // Failure
    return t2;
  }

  function solve(x) {
    return sampleCurveY(solveCurveX(x));
  }

  return solve;
}

let linear = cubicBezier(0, 0, 1, 1);
let ease = cubicBezier(0.25, 0.1, 0.25, 1);
let easeIn = cubicBezier(0.42, 0, 1, 1);
let easeOut = cubicBezier(0, 0, 0.58, 1);
let easeInOut = cubicBezier(0.42, 0, 0.58, 1);
// let myCB = cubicBezier(0.69, -0.85, 0.25, 1);
class Timeline {
  constructor() {
    this._animations = []; // 存储所有的动画
    this._status = "inited"; // 记录timeline的状态, inited, started, paused
    this._rate = 1; // 初始化速率
    this._startPoint = 0; // 设置起始时间点
  }
  start() {
    if (this._status === "started") return; // 判断当前状态
    this._status = "started"; // 设置状态为 started
    let startTime = Date.now(); // 记录开始时间
    this.pauseTime = 0; // 记录总暂停时间累加
    this._tickFunc = () => {
      for (let animation of this._animations) {
        if (!animation.finished) {
          animation.tick(
            (Date.now() - this.pauseTime - startTime) * this._rate +
              this._startPoint
          );
        }
      }
      this._tickFunc && requestAnimationFrame(this._tickFunc);
    }; // 每一帧需要执行的函数
    requestAnimationFrame(this._tickFunc); // 执行一帧动画
  }

  restart() {
    if (this._tickFunc) {
      this._tickFunc = null;
      this._resumeTick = null;
    }
    this._status = "inited";
    requestAnimationFrame(() => {
      this.start();
    });
  }
  pause() {
    if (this._status !== "started") return; // 判断当前状态
    this._status = "paused"; //设置状态为 paused
    this._pauseStart = Date.now(); // 记录暂停时间戳
    this._resumeTick = this._tickFunc; // 缓存_tickFunc
    this._tickFunc = null; // 清空_tickFunc，requestAnimationFrame的执行依赖于_tickFunc是否有值
    // clearTimeout(this._timer);
    // this._timer = null;
  }
  resume() {
    if (this._status !== "paused") return; // 判断当前状态
    this._status = "started"; //设置状态为 started
    this.pauseTime += Date.now() - this._pauseStart; // 累加暂停时间
    this._tickFunc = this._resumeTick; // 重新为_tickFunc赋值
    requestAnimationFrame(this._tickFunc, 16); // 进行下一帧动画
    // this._timer = setInterval(this._tickFunc, 16);
  }

  set startPoint(value) {
    this._startPoint = value;
  }

  get startPoint() {
    return this._startPoint;
  }

  set rate(value) {
    this._rate = value;
  }
  get rate() {
    return this._rate;
  }

  addAnimation(animation) {
    this._animations.push(animation);
  }

  removeAnimation(animation) {}

  clearAnimations() {
    this._animations = [];
  }
}

class DomElementStyleNumberAnimation {
  constructor(
    element,
    property,
    startTime,
    startValue,
    endTime,
    endValue,
    converter
  ) {
    this._element = element;
    this._property = property;
    this._startTime = startTime;
    this._startValue = startValue;
    this._endTime = endTime;
    this._endValue = endValue;
    this._converter = converter;
    this._fixKeyFrame = false;
  }
  tick(t) {
    if (t > this._endTime) {
      // 正序播放动画，矫正关键帧
      if (!this._fixKeyFrame) {
        return;
      } else {
        t = this._endTime;
        this._fixKeyFrame = false;
      }
    } else if (t < this._startTime) {
      // 倒序播放动画，矫正关键帧
      if (!this._fixKeyFrame) {
        return;
      } else {
        t = this._startTime;
        this._fixKeyFrame = false;
      }
    } else {
      this._fixKeyFrame = true;
    }
    let progress = (t - this._startTime) / (this._endTime - this._startTime);
    let displacement = ease(progress) * (this._endValue - this._startValue);
    let currentValue = displacement + this._startValue;
    this._element.style[this._property] = this._converter(currentValue);
  }
}

class DomElementStyleVectorAnimation {
  constructor(
    element,
    property,
    startTime,
    startValue,
    endTime,
    endValue,
    converter
  ) {
    this._element = element;
    this._property = property;
    this._startTime = startTime;
    this._startValue = startValue;
    this._endTime = endTime;
    this._endValue = endValue;
    this._converter = converter;
    this._fixKeyFrame = false;
  }
  tick(t) {
    if (t > this._endTime) {
      if (!this._fixKeyFrame) {
        return;
      } else {
        t = this._endTime;
      }
    } else if (t < this._startTime) {
      if (!this._fixKeyFrame) {
        return;
      } else {
        t = this._startTime;
        this._fixKeyFrame = false;
      }
    } else {
      this._fixKeyFrame = true;
    }
    let progress = (t - this._startTime) / (this._endTime - this._startTime);
    let displacement = [];
    let currentValue = [];
    for (let i = 0; i < this._endValue.length; i++) {
      displacement[i] =
        easeIn(progress) * (this._endValue[i] - this._startValue[i]);
      currentValue[i] = this._startValue[i] + displacement[i];
    }
    this._element.style[this._property] = this._converter(currentValue);
  }
}

// let tl = new Timeline();

// tl.addAnimation(
//   new DomElementStyleNumberAnimation(
//     document.getElementById("ball"),
//     "top",
//     0,
//     0,
//     500,
//     100,
//     v => `${v}px`
//   )
// );

// tl.addAnimation(
//   new DomElementStyleNumberAnimation(
//     document.getElementById("ball"),
//     "left",
//     500,
//     0,
//     1000,
//     100,
//     v => `${v}px`
//   )
// );

// tl.addAnimation(
//   new DomElementStyleNumberAnimation(
//     document.getElementById("ball"),
//     "top",
//     1000,
//     100,
//     1500,
//     0,
//     v => `${v}px`
//   )
// );

// tl.addAnimation(
//   new DomElementStyleNumberAnimation(
//     document.getElementById("ball"),
//     "left",
//     1500,
//     100,
//     2000,
//     0,
//     v => `${v}px`
//   )
// );

// tl.addAnimation(
//   new DomElementStyleVectorAnimation(
//     document.getElementById("ball"),
//     "backgroundColor",
//     1500,
//     [0, 255, 0],
//     2000,
//     [0, 0, 255],
//     v => `rgb(${v[0]}, ${v[1]}, ${v[2]})`
//   )
// );
// tl.rate = 1;
// // tl.startPoint = 2000;
// tl.start();
