import { createClient } from '@supabase/supabase-js'
import './style.css'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(url, key)

const app = document.querySelector('#app')

function login() {
  app.innerHTML = `
    <main class="login">
      <div class="box">
        <h1>💬 FonoGestão</h1>
        <p>Agenda e gestão fonoaudiológica</p>

        <input id="email" type="email" placeholder="E-mail">
        <input id="password" type="password" placeholder="Senha">

        <button id="entrar">Entrar</button>

        <div id="msg"></div>
      </div>
    </main>
  `

  document.querySelector('#entrar').onclick = async () => {
    const emailValue = document.querySelector('#email').value
    const passwordValue = document.querySelector('#password').value
    const msg = document.querySelector('#msg')

    msg.textContent = 'Entrando...'

    const { error } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue
    })

    if (error) {
      msg.textContent = error.message
    } else {
      start()
    }
  }
}

async function start() {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    login()
    return
  }

  app.innerHTML = `
    <div class="layout">

      <aside>
        <h2>💬 FonoGestão</h2>

        <button class="nav active" data-page="agenda">
          📅 Agenda
        </button>

        <button class="nav" data-page="patients">
          👥 Pacientes
        </button>

        <button class="nav" data-page="evolutions">
          📝 Evoluções
        </button>

        <button class="nav" data-page="team">
          👩‍⚕️ Equipe
        </button>

        <button class="nav" data-page="supervision">
          🔎 Supervisão
        </button>

        <button id="sair" class="logout">
          Sair
        </button>
      </aside>

      <section class="main">

        <header>
          <h1>FonoGestão</h1>
          <span>Sistema online</span>
        </header>

        <div id="page"></div>

      </section>

    </div>
  `

  document.querySelector('#sair').onclick = async () => {
    await supabase.auth.signOut()
    login()
  }

  document.querySelectorAll('.nav').forEach(button => {
    button.onclick = () => show(button.dataset.page)
  })

  show('agenda')
}

function show(page) {

  document.querySelectorAll('.nav').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.page === page
    )
  })

  const titles = {
    agenda: [
      '📅 Agenda',
      'Agenda semanal por profissional.'
    ],

    patients: [
      '👥 Pacientes',
      'Cadastro e prontuário dos pacientes.'
    ],

    evolutions: [
      '📝 Evoluções',
      'Todas as evoluções organizadas por paciente e data.'
    ],

    team: [
      '👩‍⚕️ Equipe',
      'Cadastre e gerencie as profissionais do FonoGestão.'
    ],

    supervision: [
      '🔎 Supervisão',
      'Acompanhe e revise as evoluções das profissionais.'
    ]
  }

  const [title, description] = titles[page]

  const content = document.querySelector('#page')

  content.innerHTML = `
    <div class="content">

      <h2>${title}</h2>

      <p>${description}</p>

      ${
        page === 'agenda'
          ? calendar()
          : page === 'patients'
          ? patients()
          : page === 'evolutions'
          ? evolutions()
          : page === 'team'
          ? team()
          : supervision()
      }

    </div>
  `

  if (page === 'team') {
    configurarCadastroProfissional()
  }
}

function calendar() {

  const days = [
    'Dom 23/08',
    'Seg 24/08',
    'Ter 25/08',
    'Qua 26/08',
    'Qui 27/08',
    'Sex 28/08',
    'Sáb 29/08'
  ]

  return `
    <div class="toolbar">

      <button>Hoje</button>

      <button>‹</button>

      <button>›</button>

      <select>
        <option>Todas as profissionais</option>
      </select>

    </div>

    <div class="calendar">

      <div class="days">

        ${days.map(day => `
          <b>${day}</b>
        `).join('')}

      </div>

      <div class="legend">

        <span class="blue">●</span> Agendado

        <span class="green">●</span> Atendido

        <span class="yellow">●</span> Falta

        <span class="red">●</span> Cancelado

      </div>

      <p class="empty">
        A agenda será carregada do banco assim que os pacientes
        e horários forem cadastrados.
      </p>

    </div>
  `
}

function patients() {

  return `
    <div class="box">

      <h3>Meus pacientes</h3>

      <p>
        Os pacientes serão vinculados automaticamente
        à profissional responsável.
      </p>

      <button>
        ➕ Cadastrar paciente
      </button>

    </div>
  `
}

function evolutions() {

  return `
    <div class="box">

      <h3>Histórico de evoluções</h3>

      <p>
        Cada paciente terá todas as evoluções reunidas
        por data, com profissional e feedback da supervisora.
      </p>

    </div>
  `
}

function team() {

  return `
    <div class="box">

      <h3>👩‍⚕️ Profissionais</h3>

      <p>
        Cadastre quantas profissionais forem necessárias
        para sua clínica.
      </p>

      <button id="novo-profissional">
        ➕ Criar profissional
      </button>

      <div id="form-profissional" style="display:none; margin-top:20px;">

        <h3>Nova profissional</h3>

        <input
          id="novo-nome"
          type="text"
          placeholder="Nome completo"
        >

        <input
          id="novo-email"
          type="email"
          placeholder="E-mail"
        >

        <input
          id="nova-senha"
          type="password"
          placeholder="Senha"
        >

        <select id="novo-papel">

          <option value="profissional">
            Fonoaudióloga
          </option>

          <option value="supervisora">
            Supervisora
          </option>

          <option value="outro">
            Outro profissional
          </option>

        </select>

        <button id="salvar-profissional">
          💾 Criar usuário
        </button>

        <button id="cancelar-profissional">
          Cancelar
        </button>

        <div
          id="resultado-profissional"
          style="margin-top:15px;"
        ></div>

      </div>

    </div>
  `
}

function configurarCadastroProfissional() {

  const novoBotao = document.querySelector('#novo-profissional')
  const form = document.querySelector('#form-profissional')
  const cancelar = document.querySelector('#cancelar-profissional')
  const salvar = document.querySelector('#salvar-profissional')
  const resultado = document.querySelector('#resultado-profissional')

  if (!novoBotao) return

  novoBotao.onclick = () => {
    form.style.display = 'block'
    novoBotao.style.display = 'none'
  }

  cancelar.onclick = () => {
    form.style.display = 'none'
    novoBotao.style.display = 'inline-block'
    resultado.textContent = ''
  }

  salvar.onclick = async () => {

    const nome = document.querySelector('#novo-nome').value.trim()
    const email = document.querySelector('#novo-email').value.trim()
    const senha = document.querySelector('#nova-senha').value
    const papel = document.querySelector('#novo-papel').value

    if (!nome || !email || !senha) {
      resultado.textContent =
        '⚠️ Preencha nome, e-mail e senha.'

      return
    }

    if (senha.length < 6) {
      resultado.textContent =
        '⚠️ A senha precisa ter pelo menos 6 caracteres.'

      return
    }

    resultado.textContent = '⏳ Criando usuário...'
    salvar.disabled = true

    const { data, error } =
      await supabase.functions.invoke('criar-usuario', {
        body: {
          nome,
          email,
          password: senha,
          papel
        }
      })

    salvar.disabled = false

    if (error) {

      resultado.textContent =
        '❌ Erro: ' + error.message

      return
    }

    if (data?.error) {

      resultado.textContent =
        '❌ Erro: ' + data.error

      return
    }

    resultado.textContent =
      '✅ Profissional criada com sucesso!'

    document.querySelector('#novo-nome').value = ''
    document.querySelector('#novo-email').value = ''
    document.querySelector('#nova-senha').value = ''

  }
}

function supervision() {

  return `
    <div class="box">

      <h3>Área da supervisora</h3>

      <p>
        Visualize agendas, pacientes, evoluções pendentes
        e feedbacks de todas as profissionais.
      </p>

    </div>
  `
}

start()
