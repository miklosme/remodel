import { useEffect, useRef, useState } from 'react'
import { useMotionValue, useTransform, animate } from 'framer-motion'
import MiniGL from '@/lib/MiniGL'

class MulticolorMaterial {
  constructor(minigl) {
    this.minigl = minigl
    this.vertex = `
varying vec2 v_texcoord;

void main() {
  //  float time = u_time;

  float tilt = resolution.y / 2.0 * uvNorm.y;

  vec3 pos = vec3(
    position.x,
    position.y + tilt,
    position.z
  );

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  v_texcoord = uv;
}
`

    this.fragment = `
varying vec2 v_texcoord;

void main() {
    vec3 l = mix(bl, tl, v_texcoord.t);
    vec3 r = mix(br, tr, v_texcoord.t);
    vec3 c = mix(l, r, v_texcoord.s);
    gl_FragColor = vec4(c, 1);
}
`

    this.uniforms = {
      time: new this.minigl.Uniform({
        value: 0,
      }),
      tl: new this.minigl.Uniform({
        // value: colors[0],
        type: 'vec3',
      }),
      tr: new this.minigl.Uniform({
        // value: colors[1],
        type: 'vec3',
      }),
      bl: new this.minigl.Uniform({
        // value: colors[2],
        type: 'vec3',
      }),
      br: new this.minigl.Uniform({
        // value: colors[3],
        type: 'vec3',
      }),
    }

    this.material = new this.minigl.Material(
      this.vertex,
      this.fragment,
      this.uniforms
    )
  }

  onAnimation = (delta) => {
    this.uniforms.time.value += delta
  }

  setArguments = (key, value) => {
    // console.log('setArguments', key, fixColorFormat(value));
    this.material.uniforms[key].value = fixColorFormat(value)
  }
}

class Gradient {
  constructor(height, MaterialManager) {
    this.height = height
    this.MaterialManager = MaterialManager

    this.playing = false
    this.time = 1253106
    this.last = 0
  }

  init = (el) => {
    this.minigl = new MiniGL(el)

    this.materialManager = new this.MaterialManager(this.minigl)
    this.material = this.materialManager.material
    this.geometry = new this.minigl.PlaneGeometry()
    this.mesh = new this.minigl.Mesh(this.geometry, this.material)
    this.resize()

    this.playing = true
    requestAnimationFrame(this.animate)
    window.addEventListener('resize', this.resize)
  }

  resize = () => {
    this.width = window.innerWidth
    this.minigl.setSize(this.width, this.height)
    this.minigl.setOrthographicCamera()
    this.mesh.geometry.setSize(this.width, this.height)
  }

  animate = (delta) => {
    if (0 !== this.last && this.isStatic) {
      this.minigl.render()
      this.disconnect()
      return
    }

    if (!this.shouldSkipFrame(delta)) {
      this.time += Math.min(delta - this.last, 1e3 / 15)
      this.last = delta
      // this.mesh.material.uniforms.u_time.value = this.time
      this.minigl.render()
    }

    if (this.playing) {
      requestAnimationFrame(this.animate)
    }
  }

  shouldSkipFrame = (delta) => {
    return (
      !!window.document.hidden || !this.playing || parseInt(delta, 10) % 2 === 0
    )
  }

  disconnect = () => {
    window.removeEventListener('resize', this.resize)
  }
}

function choose(...args) {
  const index = Math.floor(Math.random() * args.length)
  return args[index]
}

export default function GradientBackground({ tl, tr, bl, br, height = 800 }) {
  const [gradient] = useState(() => new Gradient(height, MulticolorMaterial))
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return

    gradient.init(ref.current)

    // init colors
    gradient.materialManager.setArguments('tl', tl[0])
    gradient.materialManager.setArguments('tr', tr[0])
    gradient.materialManager.setArguments('bl', bl[0])
    gradient.materialManager.setArguments('br', br[0])

    gradient.minigl.render()
  }, [ref.current])

  const values = [
    useMotionValue(0),
    useMotionValue(0),
    useMotionValue(0),
    useMotionValue(0),
  ]

  useEffect(() => {
    const controls = values.map((value, index) => {
      function anim(value, goal, index) {
        return animate(value, goal, {
          duration: choose(3, 4, 5, 6),
          delay: choose(3, 4, 5, 6),
          onComplete() {
            anim(value, goal === 100 ? 0 : 100, index)
          },
        })
      }
      return anim(value, 100, index)
    })

    return () => {
      controls.forEach((control) => control.stop())
    }
  })

  const gradientColors = [
    useTransform(values[0], [0, 100], tl),
    useTransform(values[1], [0, 100], tr),
    useTransform(values[2], [0, 100], bl),
    useTransform(values[3], [0, 100], br),
  ]

  useEffect(() => {
    const keys = ['tl', 'tr', 'bl', 'br']
    return gradientColors.reduce(
      (fn, color, index) => {
        const cancel = color.onChange((latest) => {
          gradient.materialManager.setArguments(keys[index], latest)
        })

        return () => {
          fn()
          cancel()
        }
      },
      () => {}
    )
  }, [])

  return <canvas ref={ref} className="shader-background" />
}

GradientBackground.defaultProps = {
  tl: ['#030712', '#4bb9e5'],
  tr: ['#030712', '#4b74e5'],
  bl: ['#030712', '#030712'],
  br: ['#030712', '#e5654b'],
}

//
// Utils
//

function rgbToHex(rgb) {
  // in case of rgba we droppign the alpha value
  if (rgb.startsWith('rgb(') || rgb.startsWith('rgba(')) {
    // Choose correct separator
    let sep = rgb.indexOf(',') > -1 ? ',' : ' '
    // Turn "rgb(r,g,b)" into [r,g,b]
    const headLength = rgb.startsWith('rgb(') ? 4 : 5
    rgb = rgb.substr(headLength).split(')')[0].split(sep)

    let r = (+rgb[0]).toString(16),
      g = (+rgb[1]).toString(16),
      b = (+rgb[2]).toString(16)

    if (r.length == 1) r = '0' + r
    if (g.length == 1) g = '0' + g
    if (b.length == 1) b = '0' + b

    return '#' + r + g + b
  }

  return rgb
}

function hexColorToNumber(hex) {
  //Check if shorthand hex value was used and double the length so the conversion in normalizeColor will work.
  if (4 === hex.length) {
    const hexTemp = hex
      .substr(1)
      .split('')
      .map((hexTemp) => hexTemp + hexTemp)
      .join('')
    hex = `#${hexTemp}`
  }

  return `0x${hex.substr(1)}`
}

function normalizeColor(hexCode) {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ]
}

function fixColorFormat(color) {
  return normalizeColor(hexColorToNumber(rgbToHex(color)))
}
