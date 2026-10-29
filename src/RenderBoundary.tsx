import { Component, type ReactNode } from 'react'

export default class RenderBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false}
  static getDerivedStateFromError(){return{failed:true}}
  render(){
    if(!this.state.failed)return this.props.children
    return <main className="delu-recovery" role="alert">
      <img src="/delu-logo.svg" alt="DeLù"/>
      <h1>Un momento, torniamo da te.</h1>
      <p>Non siamo riusciti a caricare questa pagina. Riprova per continuare.</p>
      <button onClick={()=>window.location.reload()}>RIPROVA ↗</button>
      <a href="/">TORNA ALLA HOME</a>
    </main>
  }
}
