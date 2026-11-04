import { useState } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import './CampoSenha.css'

// <input> de senha com botão de "olhinho" para mostrar/ocultar o que está sendo digitado.
// Recebe as mesmas props de um <input>; o tipo (password/text) é controlado aqui dentro.
function CampoSenha({ className = '', ...resto }) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="senha-wrapper">
      <input {...resto} className={className} type={visivel ? 'text' : 'password'} />
      <button
        type="button"
        className="senha-toggle"
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visivel}
        title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={() => setVisivel((v) => !v)}
      >
        {visivel ? <EyeSlash size={20} weight="regular" aria-hidden="true" /> : <Eye size={20} weight="regular" aria-hidden="true" />}
      </button>
    </div>
  )
}

export default CampoSenha
