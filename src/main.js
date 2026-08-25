import { createClient } from '@supabase/supabase-js'
import './style.css'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(url, key)

const app = document.querySelector('#app')
const SITE_URL = 'https://fonogestao-seven.vercel.app'

let currentProfile = null

/* =========================
   UTILITÁRIOS
========================= */

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function formatDateBR(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  })
}

function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()

  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)

  return d
}

function getWeekDays(date = new Date()) {
  const start = getWeekStart(date)

  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(start)
    d.setDate(start.getDate() + index)
    return d
  })
}

/* =========================
   LOGIN
========================= */

function login() {
  app.innerHTML = `
    <main class="login">
      <div class="box">

        <h1>💬 FonoGestão</h1>

        <p>
          Agenda e gestão fonoaudiológica
        </p>

        <input
          id="email"
          type="email"
          placeholder="E-mail"
        >

        <input
          id="password"
          type="password"
          placeholder="Senha"
        >

        <button id="entrar">
          Entrar
        </button>

        <button
          id="recuperar"
          type="button"
          style="margin-top:10px;"
        >
          🔑 Esqueci minha senha
        </button>

        <div id="msg"></div>

      </div>
    </main>
  `

  document.querySelector('#entrar').onclick =
    async () => {

      const email =
        document.querySelector('#email')
          .value.trim()

      const password =
        document.querySelector('#password')
          .value

      const msg =
        document.querySelector('#msg')

      if (!email || !password) {
        msg.textContent =
          '⚠️ Informe e-mail e senha.'
        return
      }

      msg.textContent =
        'Entrando...'

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        })

      if (error) {
        msg.textContent =
          error.message
      } else {
        start()
      }
    }

  document.querySelector('#recuperar').onclick =
    showRecovery
}

/* =========================
   RECUPERAÇÃO
========================= */

function showRecovery() {

  app.innerHTML = `
    <main class="login">
      <div class="box">

        <h1>🔑 Recuperar senha</h1>

        <p>
          Informe seu e-mail e enviaremos
          um link para criar uma nova senha.
        </p>

        <input
          id="recovery-email"
          type="email"
          placeholder="E-mail"
        >

        <button id="enviar-recuperacao">
          Enviar link
        </button>

        <button
          id="voltar-login"
          type="button"
          style="margin-top:10px;"
        >
          ← Voltar para o login
        </button>

        <div id="recovery-msg"></div>

      </div>
    </main>
  `

  document.querySelector('#voltar-login').onclick =
    login

  document.querySelector('#enviar-recuperacao').onclick =
    async () => {

      const email =
        document.querySelector('#recovery-email')
          .value.trim()

      const msg =
        document.querySelector('#recovery-msg')

      if (!email) {
        msg.textContent =
          '⚠️ Informe seu e-mail.'
        return
      }

      msg.textContent =
        '⏳ Enviando...'

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: SITE_URL
          }
        )

      if (error) {
        msg.textContent =
          '❌ ' + error.message
        return
      }

      msg.textContent =
        '✅ Link enviado! Verifique seu e-mail e também a caixa de spam.'
    }
}

/* =========================
   NOVA SENHA
========================= */

function showUpdatePassword() {

  app.innerHTML = `
    <main class="login">
      <div class="box">

        <h1>🔐 Nova senha</h1>

        <input
          id="new-password"
          type="password"
          placeholder="Nova senha"
        >

        <input
          id="confirm-password"
          type="password"
          placeholder="Confirmar nova senha"
        >

        <button id="salvar-nova-senha">
          Alterar senha
        </button>

        <div id="password-msg"></div>

      </div>
    </main>
  `

  document.querySelector('#salvar-nova-senha').onclick =
    async () => {

      const password =
        document.querySelector('#new-password')
          .value

      const confirm =
        document.querySelector('#confirm-password')
          .value

      const msg =
        document.querySelector('#password-msg')

      if (password.length < 6) {
        msg.textContent =
          '⚠️ A senha precisa ter pelo menos 6 caracteres.'
        return
      }

      if (password !== confirm) {
        msg.textContent =
          '⚠️ As senhas não conferem.'
        return
      }

      msg.textContent =
        '⏳ Alterando senha...'

      const { error } =
        await supabase.auth.updateUser({
          password
        })

      if (error) {
        msg.textContent =
          '❌ ' + error.message
        return
      }

      msg.textContent =
        '✅ Senha alterada com sucesso!'

      setTimeout(start, 1500)
    }
}

/* =========================
   PERFIL
========================= */

async function carregarPerfil() {

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    currentProfile = null
    return null
  }

  const { data, error } =
    await supabase
      .from('profiles')
      .select(`
        id,
        name,
        role,
        active,
        clinic_id
      `)
      .eq('id', user.id)
      .single()

  if (error) {
    console.error(error)
    currentProfile = null
    return null
  }

  currentProfile = data

  return data
}

function isManager() {

  if (!currentProfile) return false

  return [
    'supervisora',
    'recepcionista',
    'proprietaria'
  ].includes(currentProfile.role)
}

/* =========================
   SISTEMA
========================= */

async function start() {

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    login()
    return
  }

  const profile =
    await carregarPerfil()

  if (!profile) {
    app.innerHTML = `
      <main class="login">
        <div class="box">
          <h2>⚠️ Perfil não encontrado</h2>
          <p>
            Sua conta ainda não possui um perfil
            configurado no FonoGestão.
          </p>
          <button id="sair-erro">
            Sair
          </button>
        </div>
      </main>
    `

    document.querySelector('#sair-erro').onclick =
      async () => {
        await supabase.auth.signOut()
        login()
      }

    return
  }

  app.innerHTML = `
    <div class="layout">

      <aside>

        <h2>💬 FonoGestão</h2>

        <button
          class="nav active"
          data-page="agenda"
        >
          📅 Agenda
        </button>

        <button
          class="nav"
          data-page="patients"
        >
          👥 Pacientes
        </button>

        <button
          class="nav"
          data-page="evolutions"
        >
          📝 Evoluções
        </button>

        ${
          isManager()
            ? `
              <button
                class="nav"
                data-page="team"
              >
                👩‍⚕️ Equipe
              </button>

              <button
                class="nav"
                data-page="supervision"
              >
                🔎 Supervisão
              </button>
            `
            : ''
        }

        <button
          id="sair"
          class="logout"
        >
          Sair
        </button>

      </aside>

      <section class="main">

        <header>

          <div>
            <h1>FonoGestão</h1>

            <span>
              ${escapeHtml(profile.name)}
            </span>
          </div>

          <span>
            ${
              profile.role === 'supervisora'
                ? 'Supervisora'
                : profile.role === 'recepcionista'
                ? 'Recepção'
                : profile.role === 'proprietaria'
                ? 'Proprietária'
                : 'Profissional'
            }
          </span>

        </header>

        <div id="page"></div>

      </section>

    </div>
  `

  document.querySelector('#sair').onclick =
    async () => {

      await supabase.auth.signOut()

      currentProfile = null

      login()
    }

  document.querySelectorAll('.nav')
    .forEach(button => {

      button.onclick = () =>
        show(button.dataset.page)

    })

  show('agenda')
}

/* =========================
   NAVEGAÇÃO
========================= */

function show(page) {

  document.querySelectorAll('.nav')
    .forEach(button => {

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
      'Histórico dos atendimentos.'
    ],

    team: [
      '👩‍⚕️ Equipe',
      'Profissionais da clínica.'
    ],

    supervision: [
      '🔎 Supervisão',
      'Acompanhamento da equipe.'
    ]

  }

  const [title, description] =
    titles[page]

  const content =
    document.querySelector('#page')

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

  if (page === 'agenda') {
    configurarAgenda()
  }

  if (page === 'patients') {
    configurarCadastroPaciente()
    carregarPacientes()
  }

  if (page === 'team') {
    configurarCadastroProfissional()
  }
}

/* =========================
   AGENDA
========================= */

let agendaDate = new Date()

function calendar() {

  const days =
    getWeekDays(agendaDate)

  const manager =
    isManager()

  return `
    <div class="toolbar">

      <button id="agenda-hoje">
        Hoje
      </button>

      <button id="agenda-anterior">
        ‹
      </button>

      <button id="agenda-proxima">
        ›
      </button>

      ${
        manager
          ? `
            <select id="filtro-profissional">
              <option value="all">
                Todas as profissionais
              </option>
            </select>
          `
          : `
            <strong>
              Minha agenda
            </strong>
          `
      }

      <button id="novo-agendamento">
        ➕ Novo agendamento
      </button>

    </div>

    <div
      id="form-agendamento"
      class="box"
      style="display:none; margin-bottom:20px;"
    >

      <h3>
        ➕ Novo agendamento
      </h3>

      ${
        manager
          ? `
            <label>Profissional</label>

            <select id="ag-profissional">
              <option value="">
                Carregando profissionais...
              </option>
            </select>
          `
          : ''
      }

      <label>Paciente</label>

      <select id="ag-paciente">
        <option value="">
          Carregando pacientes...
        </option>
      </select>

      <label>Data</label>

      <input
        id="ag-data"
        type="date"
        value="${formatDate(new Date())}"
      >

      <label>Horário inicial</label>

      <input
        id="ag-inicio"
        type="time"
        value="08:00"
      >

      <label>Horário final</label>

      <input
        id="ag-fim"
        type="time"
        value="08:50"
      >

      <button id="salvar-agendamento">
        💾 Agendar
      </button>

      <button id="cancelar-agendamento">
        Cancelar
      </button>

      <div
        id="resultado-agendamento"
        style="margin-top:10px;"
      ></div>

    </div>

    <div class="calendar">

      <div class="days">

        ${days.map(day => `
          <b>
            ${day.toLocaleDateString('pt-BR', {
              weekday: 'short'
            })}
            ${formatDateBR(day)}
          </b>
        `).join('')}

      </div>

      <div id="agenda-atendimentos">
        ⏳ Carregando agenda...
      </div>

      <div class="legend">

        <span>🔵 Agendado</span>

        <span>🟢 Atendido</span>

        <span>🟡 Falta</span>

        <span>🔴 Cancelado</span>

      </div>

    </div>
  `
}

async function configurarAgenda() {

  const hoje =
    document.querySelector('#agenda-hoje')

  const anterior =
    document.querySelector('#agenda-anterior')

  const proxima =
    document.querySelector('#agenda-proxima')

  const novo =
    document.querySelector('#novo-agendamento')

  const cancelar =
    document.querySelector('#cancelar-agendamento')

  const salvar =
    document.querySelector('#salvar-agendamento')

  const filtro =
    document.querySelector('#filtro-profissional')

  if (hoje) {
    hoje.onclick = () => {

      agendaDate = new Date()

      show('agenda')
    }
  }

  if (anterior) {
    anterior.onclick = () => {

      agendaDate.setDate(
        agendaDate.getDate() - 7
      )

      show('agenda')
    }
  }

  if (proxima) {
    proxima.onclick = () => {

      agendaDate.setDate(
        agendaDate.getDate() + 7
      )

      show('agenda')
    }
  }

  if (novo) {

    novo.onclick = async () => {

      const form =
        document.querySelector('#form-agendamento')

      form.style.display = 'block'

      await carregarOpcoesAgendamento()
    }
  }

  if (cancelar) {

    cancelar.onclick = () => {

      document.querySelector(
        '#form-agendamento'
      ).style.display = 'none'
    }
  }

  if (salvar) {

    salvar.onclick =
      salvarAgendamento
  }

  if (filtro) {

    filtro.onchange =
      carregarAgenda
  }

  await carregarOpcoesAgendamento()

  await carregarAgenda()
}

/* =========================
   OPÇÕES DO AGENDAMENTO
========================= */

async function carregarOpcoesAgendamento() {

  const pacienteSelect =
    document.querySelector('#ag-paciente')

  if (!pacienteSelect) return

  const profissionalSelect =
    document.querySelector('#ag-profissional')

  if (profissionalSelect) {

    const { data, error } =
      await supabase
        .from('profiles')
        .select(
          'id, name, role'
        )
        .eq(
          'clinic_id',
          currentProfile.clinic_id
        )
        .eq(
          'active',
          true
        )
        .order('name')

    if (!error) {

      profissionalSelect.innerHTML =
        data
          .filter(
            p =>
              [
                'profissional',
                'estagiaria'
              ].includes(p.role)
          )
          .map(p => `
            <option value="${p.id}">
              ${escapeHtml(p.name)}
            </option>
          `)
          .join('')

      profissionalSelect.value =
        currentProfile.id
    }
  }

  const query =
    supabase
      .from('patients')
      .select(
        'id, name, professional_id'
      )
      .order('name')

  if (!isManager()) {

    query.eq(
      'professional_id',
      currentProfile.id
    )
  } else {

    query.eq(
      'clinic_id',
      currentProfile.clinic_id
    )
  }

  const {
    data: patientsData,
    error
  } = await query

  if (error) {

    pacienteSelect.innerHTML =
      '<option>Erro ao carregar pacientes</option>'

    return
  }

  pacienteSelect.innerHTML = `

    <option value="">
      Selecione o paciente
    </option>

    ${
      patientsData
        .map(patient => `
          <option value="${patient.id}">
            ${escapeHtml(patient.name)}
          </option>
        `)
        .join('')
    }

  `
}

/* =========================
   SALVAR AGENDAMENTO
========================= */

async function salvarAgendamento() {

  const resultado =
    document.querySelector(
      '#resultado-agendamento'
    )

  const patientId =
    document.querySelector(
      '#ag-paciente'
    ).value

  const date =
    document.querySelector(
      '#ag-data'
    ).value

  const startTime =
    document.querySelector(
      '#ag-inicio'
    ).value

  const endTime =
    document.querySelector(
      '#ag-fim'
    ).value

  const professionalSelect =
    document.querySelector(
      '#ag-profissional'
    )

  const professionalId =
    professionalSelect
      ? professionalSelect.value
      : currentProfile.id

  if (!patientId) {

    resultado.textContent =
      '⚠️ Selecione o paciente.'

    return
  }

  if (!date || !startTime || !endTime) {

    resultado.textContent =
      '⚠️ Preencha data e horários.'

    return
  }

  if (startTime >= endTime) {

    resultado.textContent =
      '⚠️ O horário final deve ser depois do horário inicial.'

    return
  }

  resultado.textContent =
    '⏳ Salvando agendamento...'

  const { error } =
    await supabase
      .from('appointments')
      .insert({

        patient_id:
          patientId,

        professional_id:
          professionalId,

        appointment_date:
          date,

        start_time:
          startTime,

        end_time:
          endTime,

        status:
          'agendado',

        clinic_id:
          currentProfile.clinic_id

      })

  if (error) {

    resultado.textContent =
      '❌ ' + error.message

    return
  }

  resultado.textContent =
    '✅ Agendamento realizado!'

  document.querySelector(
    '#ag-paciente'
  ).value = ''

  await carregarAgenda()
}

/* =========================
   CARREGAR AGENDA
========================= */

async function carregarAgenda() {

  const container =
    document.querySelector(
      '#agenda-atendimentos'
    )

  if (!container) return

  container.innerHTML =
    '⏳ Carregando agenda...'

  const days =
    getWeekDays(agendaDate)

  const firstDate =
    formatDate(days[0])

  const lastDate =
    formatDate(days[6])

  let query =
    supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        professional_id,
        appointment_date,
        start_time,
        end_time,
        status
      `)
      .gte(
        'appointment_date',
        firstDate
      )
      .lte(
        'appointment_date',
        lastDate
      )
      .eq(
        'clinic_id',
        currentProfile.clinic_id
      )
      .order(
        'start_time'
      )

  if (!isManager()) {

    query =
      query.eq(
        'professional_id',
        currentProfile.id
      )

  } else {

    const filtro =
      document.querySelector(
        '#filtro-profissional'
      )

    if (
      filtro &&
      filtro.value !== 'all'
    ) {

      query =
        query.eq(
          'professional_id',
          filtro.value
        )
    }
  }

  const {
    data: appointments,
    error
  } = await query

  if (error) {

    container.innerHTML =
      `
        <p>
          ❌ Erro ao carregar agenda:
          ${escapeHtml(error.message)}
        </p>
      `

    return
  }

  if (
    !appointments ||
    appointments.length === 0
  ) {

    container.innerHTML = `
      <p class="empty">
        Nenhum atendimento agendado nesta semana.
      </p>
    `

    return
  }

  const patientIds =
    [
      ...new Set(
        appointments.map(
          a => a.patient_id
        )
      )
    ]

  const professionalIds =
    [
      ...new Set(
        appointments.map(
          a => a.professional_id
        )
      )
    ]

  const {
    data: patientsData
  } =
    await supabase
      .from('patients')
      .select(
        'id, name'
      )
      .in(
        'id',
        patientIds
      )

  const {
    data: professionalsData
  } =
    await supabase
      .from('profiles')
      .select(
        'id, name'
      )
      .in(
        'id',
        professionalIds
      )

  const patientsMap =
    Object.fromEntries(
      (patientsData || [])
        .map(
          p => [p.id, p.name]
        )
    )

  const professionalsMap =
    Object.fromEntries(
      (professionalsData || [])
        .map(
          p => [p.id, p.name]
        )
    )

  container.innerHTML = days
    .map(day => {

      const date =
        formatDate(day)

      const dayAppointments =
        appointments.filter(
          a =>
            a.appointment_date === date
        )

      return `
        <div
          class="box"
          style="margin-top:12px;"
        >

          <h3>
            ${
              day.toLocaleDateString(
                'pt-BR',
                {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit'
                }
              )
            }
          </h3>

          ${
            dayAppointments.length === 0
              ? `
                <p>
                  Nenhum atendimento.
                </p>
              `
              : dayAppointments
                .map(a => {

                  const icon =
                    a.status === 'atendido'
                      ? '🟢'
                      : a.status === 'falta'
                      ? '🟡'
                      : a.status === 'cancelado'
                      ? '🔴'
                      : '🔵'

                  return `
                    <div
                      style="
                        padding:12px;
                        margin-top:8px;
                        border:1px solid #ddd;
                        border-radius:8px;
                      "
                    >

                      <strong>
                        ${icon}
                        ${a.start_time.slice(0,5)}
                        -
                        ${a.end_time
                          ? a.end_time.slice(0,5)
                          : ''
                        }
                      </strong>

                      <p>
                        👤
                        ${escapeHtml(
                          patientsMap[a.patient_id]
                          || 'Paciente'
                        )}
                      </p>

                      ${
                        isManager()
                          ? `
                            <p>
                              👩‍⚕️
                              ${escapeHtml(
                                professionalsMap[
                                  a.professional_id
                                ]
                                || 'Profissional'
                              )}
                            </p>
                          `
                          : ''
                      }

                      <select
                        class="status-agendamento"
                        data-id="${a.id}"
                      >

                        <option
                          value="agendado"
                          ${
                            a.status === 'agendado'
                              ? 'selected'
                              : ''
                          }
                        >
                          🔵 Agendado
                        </option>

                        <option
                          value="atendido"
                          ${
                            a.status === 'atendido'
                              ? 'selected'
                              : ''
                          }
                        >
                          🟢 Atendido
                        </option>

                        <option
                          value="falta"
                          ${
                            a.status === 'falta'
                              ? 'selected'
                              : ''
                          }
                        >
                          🟡 Falta
                        </option>

                        <option
                          value="cancelado"
                          ${
                            a.status === 'cancelado'
                              ? 'selected'
                              : ''
                          }
                        >
                          🔴 Cancelado
                        </option>

                      </select>

                    </div>
                  `
                })
                .join('')
          }

        </div>
      `
    })
    .join('')

  document.querySelectorAll(
    '.status-agendamento'
  ).forEach(select => {

    select.onchange =
      async () => {

        const { error } =
          await supabase
            .from('appointments')
            .update({
              status:
                select.value
            })
            .eq(
              'id',
              select.dataset.id
            )

        if (error) {

          alert(
            'Erro ao alterar status: ' +
            error.message
          )

          return
        }

        await carregarAgenda()
      }
  })

  const filtro =
    document.querySelector(
      '#filtro-profissional'
    )

  if (
    filtro &&
    filtro.options.length <= 1
  ) {

    const {
      data: professionals
    } =
      await supabase
        .from('profiles')
        .select(
          'id, name, role'
        )
        .eq(
          'clinic_id',
          currentProfile.clinic_id
        )
        .eq(
          'active',
          true
        )
        .order('name')

    professionals
      ?.filter(
        p =>
          [
            'profissional',
            'estagiaria'
          ].includes(p.role)
      )
      .forEach(p => {

        const option =
          document.createElement(
            'option'
          )

        option.value = p.id

        option.textContent =
          p.name

        filtro.appendChild(option)
      })
  }
}

/* =========================
   PACIENTES
========================= */

function patients() {

  return `
    <div class="box">

      <h3>👥 Pacientes</h3>

      <p>
        ${
          isManager()
            ? 'Pacientes de toda a clínica.'
            : 'Seus pacientes.'
        }
      </p>

      <button id="novo-paciente">
        ➕ Cadastrar paciente
      </button>

      <div
        id="form-paciente"
        style="display:none; margin-top:20px;"
      >

        <h3>Novo paciente</h3>

        <input
          id="paciente-nome"
          type="text"
          placeholder="Nome completo"
        >

        <input
          id="paciente-cpf"
          type="text"
          placeholder="CPF"
          maxlength="14"
        >

        <input
          id="paciente-nascimento"
          type="date"
        >

        <input
          id="paciente-responsavel"
          type="text"
          placeholder="Nome do responsável"
        >

        <input
          id="paciente-telefone"
          type="tel"
          placeholder="Telefone"
        >

        <textarea
          id="paciente-observacoes"
          placeholder="Observações"
          rows="4"
        ></textarea>

        ${
          isManager()
            ? `
              <label>
                Profissional responsável
              </label>

              <select id="paciente-profissional">
                <option>
                  Carregando...
                </option>
              </select>
            `
            : ''
        }

        <button id="salvar-paciente">
          💾 Salvar paciente
        </button>

        <button id="cancelar-paciente">
          Cancelar
        </button>

        <div
          id="resultado-paciente"
          style="margin-top:15px;"
        ></div>

      </div>

      <div
        id="lista-pacientes"
        style="margin-top:25px;"
      >
        ⏳ Carregando pacientes...
      </div>

    </div>
  `
}

async function configurarCadastroPaciente() {

  const novo =
    document.querySelector(
      '#novo-paciente'
    )

  if (!novo) return

  novo.onclick = async () => {

    const form =
      document.querySelector(
        '#form-paciente'
      )

    form.style.display =
      'block'

    novo.style.display =
      'none'

    const select =
      document.querySelector(
        '#paciente-profissional'
      )

    if (select) {

      const {
        data
      } =
        await supabase
          .from('profiles')
          .select(
            'id, name, role'
          )
          .eq(
            'clinic_id',
            currentProfile.clinic_id
          )
          .eq(
            'active',
            true
          )
          .order('name')

      select.innerHTML =
        data
          ?.filter(
            p =>
              [
                'profissional',
                'estagiaria'
              ].includes(p.role)
          )
          .map(
            p => `
              <option value="${p.id}">
                ${escapeHtml(p.name)}
              </option>
            `
          )
          .join('') || ''
    }
  }

  document.querySelector(
    '#cancelar-paciente'
  ).onclick = () => {

    document.querySelector(
      '#form-paciente'
    ).style.display = 'none'

    novo.style.display =
      'inline-block'
  }

  document.querySelector(
    '#salvar-paciente'
  ).onclick =
    salvarPaciente
}

async function salvarPaciente() {

  const resultado =
    document.querySelector(
      '#resultado-paciente'
    )

  const nome =
    document.querySelector(
      '#paciente-nome'
    ).value.trim()

  const cpf =
    document.querySelector(
      '#paciente-cpf'
    ).value.trim()

  const nascimento =
    document.querySelector(
      '#paciente-nascimento'
    ).value

  const responsavel =
    document.querySelector(
      '#paciente-responsavel'
    ).value.trim()

  const telefone =
    document.querySelector(
      '#paciente-telefone'
    ).value.trim()

  const observacoes =
    document.querySelector(
      '#paciente-observacoes'
    ).value.trim()

  const profissionalSelect =
    document.querySelector(
      '#paciente-profissional'
    )

  const professionalId =
    profissionalSelect
      ? profissionalSelect.value
      : currentProfile.id

  if (!nome || !cpf) {

    resultado.textContent =
      '⚠️ Nome e CPF são obrigatórios.'

    return
  }

  resultado.textContent =
    '⏳ Salvando...'

  const { error } =
    await supabase
      .from('patients')
      .insert({

        name:
          nome,

        cpf:
          cpf,

        birth_date:
          nascimento || null,

        guardian:
          responsavel || null,

        phone:
          telefone || null,

        notes:
          observacoes || null,

        professional_id:
          professionalId,

        clinic_id:
          currentProfile.clinic_id

      })

  if (error) {

    resultado.textContent =
      '❌ ' + error.message

    return
  }

  resultado.textContent =
    '✅ Paciente cadastrado!'

  document.querySelector(
    '#paciente-nome'
  ).value = ''

  document.querySelector(
    '#paciente-cpf'
  ).value = ''

  document.querySelector(
    '#paciente-nascimento'
  ).value = ''

  document.querySelector(
    '#paciente-responsavel'
  ).value = ''

  document.querySelector(
    '#paciente-telefone'
  ).value = ''

  document.querySelector(
    '#paciente-observacoes'
  ).value = ''

  await carregarPacientes()
}

async function carregarPacientes() {

  const lista =
    document.querySelector(
      '#lista-pacientes'
    )

  if (!lista) return

  let query =
    supabase
      .from('patients')
      .select(`
        id,
        name,
        cpf,
        birth_date,
        guardian,
        phone,
        professional_id
      `)
      .eq(
        'clinic_id',
        currentProfile.clinic_id
      )
      .order('name')

  if (!isManager()) {

    query =
      query.eq(
        'professional_id',
        currentProfile.id
      )
  }

  const {
    data,
    error
  } = await query

  if (error) {

    lista.innerHTML =
      `<p>❌ ${escapeHtml(error.message)}</p>`

    return
  }

  if (!data?.length) {

    lista.innerHTML =
      '<p>Nenhum paciente cadastrado.</p>'

    return
  }

  lista.innerHTML =
    data.map(patient => `

      <div
        class="box"
        style="margin-top:10px;"
      >

        <strong>
          ${escapeHtml(patient.name)}
        </strong>

        <p>
          🪪 CPF:
          ${escapeHtml(
            patient.cpf || 'Não informado'
          )}
        </p>

        <p>
          🎂 Nascimento:
          ${
            patient.birth_date
              || 'Não informado'
          }
        </p>

        <p>
          👨‍👩‍👧 Responsável:
          ${
            escapeHtml(
              patient.guardian
              || 'Não informado'
            )
          }
        </p>

        <p>
          📱 Telefone:
          ${
            escapeHtml(
              patient.phone
              || 'Não informado'
            )
          }
        </p>

      </div>

    `).join('')
}

/* =========================
   EVOLUÇÕES
========================= */

function evolutions() {

  return `
    <div class="box">

      <h3>📝 Evoluções</h3>

      <p>
        O histórico de evoluções ficará
        vinculado aos pacientes e atendimentos.
      </p>

    </div>
  `
}

/* =========================
   EQUIPE
========================= */

function team() {

  return `
    <div class="box">

      <h3>👩‍⚕️ Equipe</h3>

      <p>
        Gerencie os profissionais da clínica.
      </p>

      <button id="novo-profissional">
        ➕ Criar profissional
      </button>

      <div
        id="form-profissional"
        style="display:none; margin-top:20px;"
      >

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

          <option value="recepcionista">
            Recepcionista
          </option>

          <option value="supervisora">
            Supervisora
          </option>

          <option value="proprietaria">
            Proprietária
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

  const novo =
    document.querySelector(
      '#novo-profissional'
    )

  if (!novo) return

  const form =
    document.querySelector(
      '#form-profissional'
    )

  novo.onclick = () => {

    form.style.display =
      'block'

    novo.style.display =
      'none'
  }

  document.querySelector(
    '#cancelar-profissional'
  ).onclick = () => {

    form.style.display =
      'none'

    novo.style.display =
      'inline-block'
  }

  document.querySelector(
    '#salvar-profissional'
  ).onclick =
    async () => {

      const nome =
        document.querySelector(
          '#novo-nome'
        ).value.trim()

      const email =
        document.querySelector(
          '#novo-email'
        ).value.trim()

      const senha =
        document.querySelector(
          '#nova-senha'
        ).value

      const papel =
        document.querySelector(
          '#novo-papel'
        ).value

      const resultado =
        document.querySelector(
          '#resultado-profissional'
        )

      if (!nome || !email || !senha) {

        resultado.textContent =
          '⚠️ Preencha nome, e-mail e senha.'

        return
      }

      resultado.textContent =
        '⏳ Criando usuário...'

      const {
        data,
        error
      } =
        await supabase.functions.invoke(
          'criar-usuario',
          {
            body: {
              nome,
              email,
              password: senha,
              papel
            }
          }
        )

      if (error) {

        resultado.textContent =
          '❌ ' + error.message

        return
      }

      if (data?.error) {

        resultado.textContent =
          '❌ ' + data.error

        return
      }

      resultado.textContent =
        '✅ Usuário criado/vinculado com sucesso!'

      document.querySelector(
        '#novo-nome'
      ).value = ''

      document.querySelector(
        '#novo-email'
      ).value = ''

      document.querySelector(
        '#nova-senha'
      ).value = ''
    }
}

/* =========================
   SUPERVISÃO
========================= */

function supervision() {

  return `
    <div class="box">

      <h3>🔎 Supervisão</h3>

      <p>
        Aqui você poderá acompanhar as agendas,
        pacientes e evoluções de toda a equipe.
      </p>

    </div>
  `
}

/* =========================
   RECUPERAÇÃO DE SENHA
========================= */

supabase.auth.onAuthStateChange(
  event => {

    if (
      event === 'PASSWORD_RECOVERY'
    ) {

      showUpdatePassword()
    }
  }
)

/* =========================
   INICIAR
========================= */

start()
