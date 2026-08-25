import { createClient } from '@supabase/supabase-js'
import './style.css'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(url, key)

const app = document.querySelector('#app')

function login(message = '') {
  app.innerHTML = `
    <main class="login">
      <div class="box">
        <h1>💬 FonoGestão</h1>
        <p>Agenda e gestão fonoaudiológica</p>

        <input id="email" type="email" placeholder="E-mail">
        <input id="password" type="password" placeholder="Senha">

        <button id="entrar">Entrar</button>

        <button id="esqueci" type="button">
          Esqueci minha senha
        </button>

        <div id="msg">${message}</div>
      </div>
    </main>
  `

  document.querySelector('#entrar').onclick = async () => {
    const email = document.querySelector('#email').value.trim()
    const password = document.querySelector('#password').value
    const msg = document.querySelector('#msg')

    if (!email || !password) {
      msg.textContent = 'Digite seu e-mail e sua senha.'
      return
    }

    msg.textContent = 'Entrando...'

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      msg.textContent = 'E-mail ou senha incorretos.'
      console.error(error)
      return
    }

    await start()
  }

  document.querySelector('#esqueci').onclick = async () => {
    const email = document.querySelector('#email').value.trim()
    const msg = document.querySelector('#msg')

    if (!email) {
      msg.textContent = 'Digite seu e-mail primeiro.'
      return
    }

    msg.textContent = 'Enviando e-mail...'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })

    if (error) {
      msg.textContent = error.message
      console.error(error)
      return
    }

    msg.textContent =
      'E-mail enviado! Verifique sua caixa de entrada para criar uma nova senha.'
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

  const {
    data: { user }
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    app.innerHTML = `
      <main class="login">
        <div class="box">
          <h1>💬 FonoGestão</h1>
          <h2>Perfil não encontrado</h2>
          <p>
            O usuário foi autenticado, mas ainda não possui
            um perfil cadastrado no sistema.
          </p>

          <button id="sair">Sair</button>
        </div>
      </main>
    `

    document.querySelector('#sair').onclick = async () => {
      await supabase.auth.signOut()
      login()
    }

    return
  }

  app.innerHTML = `
    <div class="layout">

      <aside>
        <h2>💬 FonoGestão</h2>

        <p>
          Olá, ${profile.name}
        </p>

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
          <div>
            <h1>FonoGestão</h1>
            <span>
              ${profile.role === 'supervisora'
                ? 'Supervisora'
                : 'Profissional'}
            </span>
          </div>

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
    button.onclick = () => {
      showPage(button.dataset.page, profile)
    }
  })

  showPage('agenda', profile)
}

function showPage(page, profile) {

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
      'Histórico de evoluções por paciente e data.'
    ],

    team: [
      '👩‍⚕️ Equipe',
      'Profissionais da equipe.'
    ],

    supervision: [
      '🔎 Supervisão',
      'Acompanhamento das profissionais.'
    ]
  }

  const [title, description] = titles[page]

  document.querySelector('#page').innerHTML = `
    <div class="content">

      <h2>${title}</h2>

      <p>${description}</p>

      <div class="box">

        ${
          page === 'agenda'
            ? `
              <h3>Agenda</h3>
              <p>
                A agenda será carregada do banco de dados.
              </p>
            `

            : page === 'patients'
            ? `
              <h3>Pacientes</h3>
              <p>
                Aqui ficarão os 45 pacientes,
                organizados por profissional.
              </p>
            `

            : page === 'evolutions'
            ? `
              <h3>Evoluções</h3>
              <p>
                Todas as evoluções ficarão reunidas
                por paciente e por data.
              </p>
            `

            : page === 'team'
            ? `
              <h3>Equipe</h3>
              <p>
                Aqui serão cadastradas as profissionais.
              </p>
            `

            : `
              <h3>Supervisão</h3>
              <p>
                Aqui você poderá acompanhar as evoluções
                das profissionais.
              </p>
            `
        }

      </div>

    </div>
  `
}

start()
