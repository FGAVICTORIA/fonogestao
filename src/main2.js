import { createClient } from '@supabase/supabase-js'
import './style.css'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(url, key)

const app = document.querySelector('#app')
const SITE_URL = 'https://fonogestao-seven.vercel.app'

let currentProfile = null
let currentWeek = new Date()
let activeProfessionalFilter = ''

function canManageAppointments() {
  return [
    'profissional',
    'estagiaria',
    'supervisora',
    'proprietaria',
    'recepcionista'
  ].includes(currentProfile?.role)
}

const MANAGER_ROLES = [
  'supervisora',
  'proprietaria',
  'recepcionista'
]

function isManager() {
  return MANAGER_ROLES.includes(currentProfile?.role)
}

function isProfessional() {
  return ['profissional', 'estagiaria'].includes(currentProfile?.role)
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(dateString) {
  if (!dateString) return ''

  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

function dateInputValue(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day

  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)

  return d
}

function getWeekDates() {
  const monday = getMonday(currentWeek)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

function roleLabel(role) {
  const labels = {
    supervisora: 'Supervisora',
    proprietaria: 'Proprietária',
    recepcionista: 'Recepcionista',
    profissional: 'Fonoaudióloga',
    estagiaria: 'Estagiária'
  }

  return labels[role] || role
}

function canWriteEvolution() {
  return [
    'profissional',
    'estagiaria',
    'supervisora',
    'proprietaria'
  ].includes(currentProfile?.role)
}

function canManagePatientData() {
  return [
    'profissional',
    'estagiaria',
    'supervisora',
    'proprietaria'
  ].includes(currentProfile?.role)
}

function statusLabel(status) {
  const labels = {
    agendado: 'Agendado',
    atendido: 'Atendido',
    falta: 'Falta',
    cancelado: 'Cancelado'
  }

  return labels[status] || status || 'Agendado'
}

function getStatusClass(status) {
  return `status-${status || 'agendado'}`
}

function addDaysToDate(dateString, amount) {
  const d = new Date(`${dateString}T12:00:00`)
  d.setDate(d.getDate() + amount)
  return dateInputValue(d)
}

function addMonthsToDate(dateString, amount) {
  const d = new Date(`${dateString}T12:00:00`)
  d.setMonth(d.getMonth() + amount)
  return dateInputValue(d)
}

function injectFonoGestaoEnhancements() {
  if (document.querySelector('#fonogestao-enhancements')) return

  const style = document.createElement('style')
  style.id = 'fonogestao-enhancements'

  style.textContent = `
    .fg-calendar-wrap {
      overflow-x: auto;
      width: 100%;
    }

    .fg-calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(170px, 1fr));
      min-width: 1190px;
      border: 1px solid #dbe3ee;
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
    }

    .fg-day-column {
      min-width: 0;
      border-right: 1px solid #e5e7eb;
      min-height: 430px;
    }

    .fg-day-column:last-child {
      border-right: 0;
    }

    .fg-day-header {
      padding: 10px 8px;
      text-align: center;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 700;
      text-transform: capitalize;
    }

    .fg-day-header small {
      display: block;
      color: #64748b;
      font-weight: 500;
      margin-top: 3px;
    }

    .fg-day-content {
      padding: 7px;
    }

    .fg-appointment-card {
      border: 1px solid #dbe3ee;
      border-left: 5px solid #2563eb;
      border-radius: 8px;
      background: #fff;
      padding: 8px;
      margin-bottom: 8px;
      box-shadow: 0 1px 2px rgba(15,23,42,.05);
    }

    .fg-appointment-card.status-agendado {
      border-left-color: #2563eb;
      background: #eff6ff;
    }

    .fg-appointment-card.status-atendido {
      border-left-color: #16a34a;
      background: #f0fdf4;
    }

    .fg-appointment-card.status-falta {
      border-left-color: #eab308;
      background: #fefce8;
    }

    .fg-appointment-card.status-cancelado {
      border-left-color: #dc2626;
      background: #fef2f2;
      opacity: .86;
    }

    .fg-appointment-time {
      font-weight: 800;
      font-size: 13px;
    }

    .fg-appointment-patient {
      font-weight: 700;
      margin-top: 4px;
    }

    .fg-appointment-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .fg-button-row {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      margin-top: 7px;
    }

    .fg-button-row button {
      padding: 4px 7px;
      font-size: 11px;
    }

    .fg-status-pill {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
    }

    .fg-status-pill.status-agendado {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .fg-status-pill.status-atendido {
      background: #dcfce7;
      color: #166534;
    }

    .fg-status-pill.status-falta {
      background: #fef9c3;
      color: #854d0e;
    }

    .fg-status-pill.status-cancelado {
      background: #fee2e2;
      color: #991b1b;
    }

    .fg-patient-actions {
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      margin-top:10px;
    }

    .fg-form-grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
    }

    .fg-full {
      grid-column:1/-1;
    }

    .fg-form-grid label {
      display:block;
      font-size:13px;
      font-weight:700;
      margin-bottom:4px;
    }

    .fg-form-grid input,
    .fg-form-grid select,
    .fg-form-grid textarea {
      width:100%;
      box-sizing:border-box;
      padding:9px;
      border:1px solid #cbd5e1;
      border-radius:7px;
      background:#fff;
    }

    .fg-form-grid textarea {
      min-height:130px;
      resize:vertical;
    }

    .fg-modal-section {
      margin-top:12px;
      padding-top:12px;
      border-top:1px solid #e5e7eb;
    }

    @media(max-width: 900px) {
      .fg-form-grid {
        grid-template-columns:1fr;
      }

      .fg-calendar-grid {
        min-width: 980px;
      }
    }
  `

  document.head.appendChild(style)
}

/* =========================================================
   LOGIN
========================================================= */

function login(message = '') {
  app.innerHTML = `
    <main class="login">
      <div class="box">

        <h1>💬 FonoGestão</h1>

        <p>Agenda e gestão fonoaudiológica</p>

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
          id="esqueci-senha"
          style="margin-top:10px;"
        >
          Esqueci minha senha
        </button>

        <div id="msg">
          ${escapeHtml(message)}
        </div>

      </div>
    </main>
  `

  document.querySelector('#entrar').onclick = async () => {
    const email = document.querySelector('#email').value.trim()
    const password = document.querySelector('#password').value
    const msg = document.querySelector('#msg')

    if (!email || !password) {
      msg.textContent = 'Informe seu e-mail e sua senha.'
      return
    }

    msg.textContent = 'Entrando...'

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      msg.textContent = error.message
      return
    }

    await start()
  }

  document.querySelector('#esqueci-senha').onclick =
    async () => {
      const email = document.querySelector('#email').value.trim()
      const msg = document.querySelector('#msg')

      if (!email) {
        msg.textContent =
          'Digite seu e-mail primeiro.'
        return
      }

      msg.textContent = 'Enviando link...'

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${SITE_URL}/`
          }
        )

      if (error) {
        msg.textContent = error.message
      } else {
        msg.textContent =
          '✅ Enviamos um link para seu e-mail.'
      }
    }
}

/* =========================================================
   PERFIL
========================================================= */

async function loadProfile() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Usuário não encontrado:', userError)
    return null
  }

  console.log('ID do usuário autenticado:', user.id)
  console.log('E-mail:', user.email)
  console.log('Metadados:', user.user_metadata)

  const { data: perfilPorId, error: erroPorId } =
    await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)

      .maybeSingle()

  if (erroPorId) {
    console.error('Erro ao buscar perfil pelo ID:', erroPorId)
    return null
  }

  if (perfilPorId) {
    console.log('Perfil encontrado pelo ID:', perfilPorId)
    return perfilPorId
  }

  const nome =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.nome

  if (nome) {
    console.log('Tentando encontrar perfil pelo nome:', nome)

    const { data: perfilPorNome, error: erroPorNome } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('name', nome)
        .eq('active', true)
        .maybeSingle()

    if (erroPorNome) {
      console.error('Erro ao buscar perfil pelo nome:', erroPorNome)
    }

    if (perfilPorNome) {
      console.log('Perfil encontrado pelo nome:', perfilPorNome)
      return perfilPorNome
    }
  }

  const { data: perfis, error: erroPerfis } =
    await supabase
      .from('profiles')
      .select('*')
      .eq('active', true)

  if (erroPerfis) {
    console.error('Erro ao buscar perfis ativos:', erroPerfis)
    return null
  }

  console.log('Perfis ativos encontrados:', perfis)

  if (nome && perfis?.length) {
    const nomeNormalizado = nome.trim().toLowerCase()

    const perfilCorrespondente = perfis.find(
      perfil =>
        perfil.name?.trim().toLowerCase() === nomeNormalizado
    )

    if (perfilCorrespondente) {
      console.log(
        'Perfil encontrado por correspondência de nome:',
        perfilCorrespondente
      )
      return perfilCorrespondente
    }
  }

  console.error('PERFIL NÃO ENCONTRADO.', {
    userId: user.id,
    email: user.email,
    nome,
    perfis
  })

  return null
}

/* =========================================================
   INÍCIO
========================================================= */

async function start() {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    login()
    return
  }

  currentProfile = await loadProfile()

  if (!currentProfile) {
    app.innerHTML = `
      <main class="login">
        <div class="box">

          <h1>⚠️ Perfil não encontrado</h1>

          <p>
            Sua conta ainda não possui um perfil
            configurado no FonoGestão.
          </p>

          <button id="sair">
            Sair
          </button>

        </div>
      </main>
    `

    document.querySelector('#sair').onclick =
      async () => {
        await supabase.auth.signOut()
        login()
      }

    return
  }

  renderApp()
}

/* =========================================================
   APLICAÇÃO
========================================================= */

function renderApp() {
  app.innerHTML = `
    <div class="layout">

      <aside>

        <h2>💬 FonoGestão</h2>

        <div style="padding:10px 15px;">
          <strong>
            ${escapeHtml(currentProfile.name)}
          </strong>

          <small style="display:block;">
            ${roleLabel(currentProfile.role)}
          </small>
        </div>

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
          <h1>FonoGestão</h1>
          <span>Sistema online</span>
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

  document
    .querySelectorAll('.nav')
    .forEach(button => {
      button.onclick = () =>
        show(button.dataset.page)
    })

  show('agenda')
}

async function show(page) {
  document
    .querySelectorAll('.nav')
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
      'Histórico de evoluções por paciente.'
    ],

    team: [
      '👩‍⚕️ Equipe',
      'Profissionais cadastrados no FonoGestão.'
    ],

    supervision: [
      '🔎 Supervisão',
      'Acompanhe agendas, pacientes e evoluções da clínica.'
    ]
  }

  const [
    title,
    description
  ] = titles[page]

  document.querySelector('#page').innerHTML = `
    <div class="content">

      <h2>${title}</h2>

      <p>${description}</p>

      <div id="page-content">
        Carregando...
      </div>

    </div>
  `

  if (page === 'agenda') {
    await renderAgenda()
  }

  if (page === 'patients') {
    await renderPatients()
  }

  if (page === 'evolutions') {
    await renderEvolutions()
  }

  if (page === 'team') {
    await renderTeam()
  }

  if (page === 'supervision') {
    await renderSupervision()
  }
}
/* =========================================================
   PROFISSIONAIS
========================================================= */

async function getProfessionals() {
  const {
    data,
    error
  } = await supabase
    .from('profiles')
    .select(
      'id,name,role,clinic_id,active'
    )
    .eq(
      'clinic_id',
      currentProfile.clinic_id
    )
    .eq(
      'active',
      true
    )
    .in(
      'role',
      [
        'profissional',
        'estagiaria',
        'supervisora'
      ]
    )
    .order('name')

  if (error) {
    console.error(
      'Erro ao carregar profissionais:',
      error
    )

    return []
  }

  return data || []
}

/* =========================================================
   AGENDA
========================================================= */

async function getAppointments(
  professionalId = ''
) {
  const weekDates = getWeekDates()

  const firstDate =
    dateInputValue(weekDates[0])

  const lastDate =
    dateInputValue(weekDates[6])

  let query =
    supabase
      .from('appointments')
      .select('*')
      .gte(
        'appointment_date',
        firstDate
      )
      .lte(
        'appointment_date',
        lastDate
      )
      .order(
        'appointment_date'
      )
      .order(
        'start_time'
      )

  if (isProfessional()) {
    query =
      query.eq(
        'professional_id',
        currentProfile.id
      )
  } else if (professionalId) {
    query =
      query.eq(
        'professional_id',
        professionalId
      )
  }

  const {
    data,
    error
  } = await query

  if (error) {
    console.error(
      'Erro ao carregar agenda:',
      error
    )

    return {
      data: [],
      error
    }
  }

  return {
    data: data || [],
    error: null
  }
}

async function getPatientsForAppointments(
  appointments
) {
  const patientIds = [
    ...new Set(
      (appointments || [])
        .map(
          appointment =>
            appointment.patient_id
        )
        .filter(Boolean)
    )
  ]

  if (!patientIds.length) {
    return {}
  }

  const {
    data,
    error
  } = await supabase
    .from('patients')
    .select(
      'id,name,cpf'
    )
    .in(
      'id',
      patientIds
    )

  if (error) {
    console.error(
      'Erro ao carregar pacientes da agenda:',
      error
    )

    return {}
  }

  const map = {}

  ;(data || []).forEach(
    patient => {
      map[patient.id] = patient
    }
  )

  return map
}

function renderAppointmentCard(
  appointment,
  patientsMap,
  professionalMap
) {
  const patient =
    patientsMap[
      appointment.patient_id
    ]

  const professionalName =
    professionalMap[
      appointment.professional_id
    ] || ''

  const status =
    appointment.status || 'agendado'

  return `
    <div
      class="fg-appointment-card ${getStatusClass(status)}"
    >

      <div class="fg-appointment-time">
        ${appointment.start_time?.slice(0, 5) || '--:--'}
        ${
          appointment.end_time
            ? ` - ${appointment.end_time.slice(0, 5)}`
            : ''
        }
      </div>

      <div class="fg-appointment-patient">
        ${escapeHtml(
          patient?.name || 'Paciente'
        )}
      </div>

      ${
        patient?.cpf
          ? `
            <div class="fg-appointment-meta">
              CPF: ${escapeHtml(patient.cpf)}
            </div>
          `
          : ''
      }

      ${
        isManager()
          ? `
            <div class="fg-appointment-meta">
              👩‍⚕️ ${escapeHtml(professionalName)}
            </div>
          `
          : ''
      }

      ${
        appointment.recurrence_rule
          ? `
            <div class="fg-appointment-meta">
              🔁 Recorrente
            </div>
          `
          : ''
      }

      <span
        class="fg-status-pill ${getStatusClass(status)}"
      >
        ${statusLabel(status)}
      </span>

      ${
        canManageAppointments()
          ? `
            <div class="fg-button-row">

              <button
                class="fg-btn secondary editar-agendamento"
                data-id="${appointment.id}"
              >
                ✏️ Editar
              </button>

              ${
                status === 'agendado'
                  ? `
                    <button
                      class="fg-btn success marcar-atendido"
                      data-id="${appointment.id}"
                    >
                      ✅ Atendido
                    </button>

                    <button
                      class="fg-btn warning marcar-falta"
                      data-id="${appointment.id}"
                    >
                      🟡 Falta
                    </button>
                  `
                  : ''
              }

              ${
                status !== 'cancelado'
                  ? `
                    <button
                      class="fg-btn danger cancelar-agendamento"
                      data-id="${appointment.id}"
                    >
                      ❌ Cancelar
                    </button>
                  `
                  : ''
              }

              <button
                class="fg-btn danger excluir-agendamento"
                data-id="${appointment.id}"
              >
                🗑️ Excluir
              </button>

            </div>
          `
          : ''
      }

    </div>
  `
}

async function renderAgenda() {
  const container =
    document.querySelector(
      '#page-content'
    )

  const professionals =
    await getProfessionals()

  let selectedProfessional = ''

  const {
    data: appointments
  } = await getAppointments()

  const patientsMap =
    await getPatientsForAppointments(
      appointments
    )

  const professionalMap = {}

  professionals.forEach(
    professional => {
      professionalMap[
        professional.id
      ] = professional.name
    }
  )

  if (
    isManager()
  ) {
    activeProfessionalFilter =
      activeProfessionalFilter || ''
  }

  const weekDates =
    getWeekDates()

  container.innerHTML = `
    <div class="box">

      <div class="fg-toolbar">

        <button
          id="agenda-hoje"
          class="fg-btn secondary"
        >
          Hoje
        </button>

        <button
          id="agenda-anterior"
          class="fg-btn secondary"
        >
          ‹
        </button>

        <strong>
          ${formatDate(
            dateInputValue(
              weekDates[0]
            )
          )}
          —
          ${formatDate(
            dateInputValue(
              weekDates[6]
            )
          )}
        </strong>

        <button
          id="agenda-proxima"
          class="fg-btn secondary"
        >
          ›
        </button>

        ${
          isManager()
            ? `
              <select
                id="filtro-profissional"
              >
                <option value="">
                  Todas as profissionais
                </option>

                ${
                  professionals
                    .map(
                      professional => `
                        <option
                          value="${professional.id}"
                          ${
                            activeProfessionalFilter ===
                            professional.id
                              ? 'selected'
                              : ''
                          }
                        >
                          ${escapeHtml(
                            professional.name
                          )}
                        </option>
                      `
                    )
                    .join('')
                }
              </select>
            `
            : `
              <strong>
                ${escapeHtml(
                  currentProfile.name
                )}
              </strong>
            `
        }

        ${
          canManageAppointments()
            ? `
              <button
                id="novo-agendamento"
                class="fg-btn primary"
              >
                ➕ Agendar
              </button>
            `
            : ''
        }

      </div>

      <div
        id="form-agendamento"
        style="display:none; margin-bottom:20px;"
      ></div>

      <div class="fg-calendar-wrap">

        <div class="fg-calendar-grid">

          ${
            weekDates
              .map(
                date => {
                  const dateValue =
                    dateInputValue(
                      date
                    )

                  const dayAppointments =
                    (appointments || [])
                      .filter(
                        appointment =>
                          appointment.appointment_date ===
                          dateValue
                      )

                  return `
                    <div class="fg-day-column">

                      <div class="fg-day-header">

                        ${escapeHtml(
                          date.toLocaleDateString(
                            'pt-BR',
                            {
                              weekday: 'long'
                            }
                          )
                        )}

                        <small>
                          ${date.toLocaleDateString(
                            'pt-BR',
                            {
                              day: '2-digit',
                              month: '2-digit'
                            }
                          )}
                        </small>

                      </div>

                      <div class="fg-day-content">

                        ${
                          dayAppointments.length
                            ? dayAppointments
                                .map(
                                  appointment =>
                                    renderAppointmentCard(
                                      appointment,
                                      patientsMap,
                                      professionalMap
                                    )
                                )
                                .join('')
                            : `
                              <div class="fg-empty">
                                Nenhum atendimento
                              </div>
                            `
                        }

                      </div>

                    </div>
                  `
                }
              )
              .join('')
          }

        </div>

      </div>

    </div>
  `

  document.querySelector(
    '#agenda-hoje'
  ).onclick = () => {
    currentWeek = new Date()
    renderAgenda()
  }

  document.querySelector(
    '#agenda-anterior'
  ).onclick = () => {
    currentWeek.setDate(
      currentWeek.getDate() - 7
    )

    renderAgenda()
  }

  document.querySelector(
    '#agenda-proxima'
  ).onclick = () => {
    currentWeek.setDate(
      currentWeek.getDate() + 7
    )

    renderAgenda()
  }

  const filtro =
    document.querySelector(
      '#filtro-profissional'
    )

  if (filtro) {
    filtro.onchange = () => {
      activeProfessionalFilter =
        filtro.value

      renderAgendaFiltrada(
        filtro.value
      )
    }
  }

  const novo =
    document.querySelector(
      '#novo-agendamento'
    )

  if (novo) {
    novo.onclick = async () => {
      await mostrarFormularioAgendamento(
        professionals
      )
    }
  }

  document
    .querySelectorAll(
      '.editar-agendamento'
    )
    .forEach(
      button => {
        button.onclick = async () => {

          const appointment =
            (appointments || [])
              .find(
                item =>
                  String(item.id) ===
                  String(button.dataset.id)
              )

          if (!appointment) return

          await mostrarFormularioAgendamento(
            professionals,
            appointment
          )
        }
      }
    )

  document
    .querySelectorAll(
      '.excluir-agendamento'
    )
    .forEach(
      button => {
        button.onclick = async () => {

          const ok =
            confirm(
              'Deseja realmente excluir este agendamento?'
            )

          if (!ok) return

          const {
            error
          } = await supabase
            .from('appointments')
            .delete()
            .eq(
              'id',
              button.dataset.id
            )

          if (error) {
            alert(
              'Não foi possível excluir: ' +
              error.message
            )

            return
          }

          renderAgenda()
        }
      }
    )

  document
    .querySelectorAll(
      '.cancelar-agendamento'
    )
    .forEach(
      button => {
        button.onclick = async () => {

          await alterarStatusAgendamento(
            button.dataset.id,
            'cancelado'
          )
        }
      }
    )

  document
    .querySelectorAll(
      '.marcar-atendido'
    )
    .forEach(
      button => {
        button.onclick = async () => {

          await alterarStatusAgendamento(
            button.dataset.id,
            'atendido'
          )
        }
      }
    )

  document
    .querySelectorAll(
      '.marcar-falta'
    )
    .forEach(
      button => {
        button.onclick = async () => {

          await alterarStatusAgendamento(
            button.dataset.id,
            'falta'
          )
        }
      }
    )
}

async function renderAgendaFiltrada(
  professionalId
) {
  activeProfessionalFilter =
    professionalId || ''

  const container =
    document.querySelector(
      '#page-content'
    )

  const professionals =
    await getProfessionals()

  const {
    data: appointments
  } = await getAppointments(
    professionalId
  )

  const patientsMap =
    await getPatientsForAppointments(
      appointments
    )

  const professionalMap = {}

  professionals.forEach(
    professional => {
      professionalMap[
        professional.id
      ] = professional.name
    }
  )

  const weekDates =
    getWeekDates()

  container.innerHTML = `
    <div class="box">

      <div class="fg-toolbar">

        <button
          id="voltar-agenda"
          class="fg-btn secondary"
        >
          ← Voltar
        </button>

        <strong>
          ${
            professionalId
              ? escapeHtml(
                  professionalMap[
                    professionalId
                  ] || ''
                )
              : 'Todas as profissionais'
          }
        </strong>

      </div>

      <div class="fg-calendar-wrap">

        <div class="fg-calendar-grid">

          ${
            weekDates
              .map(
                date => {

                  const dateValue =
                    dateInputValue(
                      date
                    )

                  const dayAppointments =
                    (appointments || [])
                      .filter(
                        appointment =>
                          appointment.appointment_date ===
                          dateValue
                      )

                  return `
                    <div class="fg-day-column">

                      <div class="fg-day-header">
                        ${escapeHtml(
                          date.toLocaleDateString(
                            'pt-BR',
                            {
                              weekday: 'long'
                            }
                          )
                        )}

                        <small>
                          ${formatDate(
                            dateValue
                          )}
                        </small>
                      </div>

                      <div class="fg-day-content">

                        ${
                          dayAppointments.length
                            ? dayAppointments
                                .map(
                                  appointment =>
                                    renderAppointmentCard(
                                      appointment,
                                      patientsMap,
                                      professionalMap
                                    )
                                )
                                .join('')
                            : `
                              <div class="fg-empty">
                                Nenhum atendimento
                              </div>
                            `
                        }

                      </div>

                    </div>
                  `
                }
              )
              .join('')
          }

        </div>

      </div>

    </div>
  `

  document.querySelector(
    '#voltar-agenda'
  ).onclick = () => {
    activeProfessionalFilter = ''
    renderAgenda()
  }

  document
    .querySelectorAll(
      '.excluir-agendamento'
    )
    .forEach(
      button => {
        button.onclick = async () => {

          if (
            !confirm(
              'Deseja realmente excluir este agendamento?'
            )
          ) {
            return
          }

          const {
            error
          } = await supabase
            .from('appointments')
            .delete()
            .eq(
              'id',
              button.dataset.id
            )

          if (error) {
            alert(
              error.message
            )
            return
          }

          renderAgendaFiltrada(
            professionalId
          )
        }
      }
    )
}

async function alterarStatusAgendamento(
  appointmentId,
  status
) {
  const {
    error
  } = await supabase
    .from('appointments')
    .update({
      status
    })
    .eq(
      'id',
      appointmentId
    )

  if (error) {
    alert(
      'Erro ao alterar atendimento: ' +
      error.message
    )

    return
  }

  renderAgenda()
}

/* =========================================================
   FORMULÁRIO DE AGENDAMENTO
========================================================= */

async function mostrarFormularioAgendamento(
  professionals,
  editingAppointment = null
) {
  const form =
    document.querySelector(
      '#form-agendamento'
    )

  const patients =
    await getPatients()

  form.style.display = 'block'

  const appointment =
    editingAppointment

  form.innerHTML = `
    <div class="box">

      <h3>
        📅
        ${
          appointment
            ? 'Editar agendamento'
            : 'Novo agendamento'
        }
      </h3>

      <div class="fg-form-grid">

        <div>
          <label>Paciente</label>

          <select id="ag-paciente">

            <option value="">
              Selecione
            </option>

            ${
              patients
                .map(
                  patient => `
                    <option
                      value="${patient.id}"
                      ${
                        appointment?.patient_id ===
                        patient.id
                          ? 'selected'
                          : ''
                      }
                    >
                      ${escapeHtml(
                        patient.name
                      )}
                    </option>
                  `
                )
                .join('')
            }

          </select>
        </div>

        <div>
          <label>Profissional</label>

          <select id="ag-profissional">

            ${
              professionals
                .map(
                  professional => `
                    <option
                      value="${professional.id}"
                      ${
                        (
                          appointment?.professional_id ||
                          (
                            !isManager()
                              ? currentProfile.id
                              : ''
                          )
                        ) ===
                        professional.id
                          ? 'selected'
                          : ''
                      }
                    >
                      ${escapeHtml(
                        professional.name
                      )}
                    </option>
                  `
                )
                .join('')
            }

          </select>
        </div>

        <div>
          <label>Data</label>

          <input
            id="ag-data"
            type="date"
            value="${
              appointment?.appointment_date ||
              dateInputValue(new Date())
            }"
          >
        </div>

        <div>
          <label>Horário inicial</label>

          <input
            id="ag-inicio"
            type="time"
            value="${
              appointment?.start_time?.slice(0,5) ||
              ''
            }"
          >
        </div>

        <div>
          <label>Horário final</label>

          <input
            id="ag-fim"
            type="time"
            value="${
              appointment?.end_time?.slice(0,5) ||
              ''
            }"
          >
        </div>

        ${
          !appointment
            ? `
              <div>
                <label>Repetir</label>

                <select id="ag-recorrencia">
                  <option value="nenhuma">
                    Não repetir
                  </option>

                  <option value="semanal">
                    Toda semana
                  </option>

                  <option value="quinzenal">
                    A cada 2 semanas
                  </option>

                  <option value="mensal">
                    Todo mês
                  </option>
                </select>
              </div>

              <div>
                <label>
                  Quantidade de atendimentos
                </label>

                <input
                  id="ag-quantidade"
                  type="number"
                  min="1"
                  max="100"
                  value="1"
                >
              </div>
            `
            : ''
        }

        <div
          class="fg-full"
          style="display:flex; gap:8px;"
        >

          <button
            id="salvar-agendamento"
            class="fg-btn primary"
          >
            💾
            ${
              appointment
                ? 'Salvar alterações'
                : 'Salvar agendamento'
            }
          </button>

          <button
            id="fechar-agendamento"
            class="fg-btn secondary"
          >
            Cancelar
          </button>

        </div>

        <div
          id="resultado-agendamento"
          class="fg-full"
        ></div>

      </div>

    </div>
  `

  document.querySelector(
    '#fechar-agendamento'
  ).onclick = () => {
    form.style.display = 'none'
  }

  document.querySelector(
    '#salvar-agendamento'
  ).onclick = async () => {

    const patientId =
      document.querySelector(
        '#ag-paciente'
      ).value

    const professionalId =
      document.querySelector(
        '#ag-profissional'
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

    const result =
      document.querySelector(
        '#resultado-agendamento'
      )

    if (
      !patientId ||
      !professionalId ||
      !date ||
      !startTime
    ) {
      result.textContent =
        '⚠️ Preencha paciente, profissional, data e horário.'

      return
    }

    if (
      endTime &&
      startTime >= endTime
    ) {
      result.textContent =
        '⚠️ O horário final deve ser depois do inicial.'

      return
    }

    result.textContent =
      '⏳ Salvando...'

    if (appointment) {

      const {
        error
      } = await supabase
        .from('appointments')
        .update({
          patient_id:
            patientId,
          professional_id:
            professionalId,
          appointment_date:
            date,
          start_time:
            startTime,
          end_time:
            endTime || null
        })
        .eq(
          'id',
          appointment.id
        )

      if (error) {
        result.textContent =
          '❌ ' +
          error.message

        return
      }

      result.textContent =
        '✅ Agendamento atualizado!'

      setTimeout(() => {
        form.style.display =
          'none'

        renderAgenda()
      }, 700)

      return
    }

    const recurrence =
      document.querySelector(
        '#ag-recorrencia'
      ).value

    const quantity =
      Math.max(
        1,
        Number(
          document.querySelector(
            '#ag-quantidade'
          ).value || 1
        )
      )

    const appointmentsToCreate = []

    for (
      let index = 0;
      index < quantity;
      index++
    ) {

      let appointmentDate =
        date

      if (
        recurrence ===
        'semanal'
      ) {
        appointmentDate =
          addDaysToDate(
            date,
            index * 7
          )
      }

      if (
        recurrence ===
        'quinzenal'
      ) {
        appointmentDate =
          addDaysToDate(
            date,
            index * 14
          )
      }

      if (
        recurrence ===
        'mensal'
      ) {
        appointmentDate =
          addMonthsToDate(
            date,
            index
          )
      }

      appointmentsToCreate.push({
        patient_id:
          patientId,

        professional_id:
          professionalId,

        appointment_date:
          appointmentDate,

        start_time:
          startTime,

        end_time:
          endTime || null,

        status:
          'agendado',

        clinic_id:
          currentProfile.clinic_id
      })
    }

    const {
      error
    } = await supabase
      .from('appointments')
      .insert(
        appointmentsToCreate
      )

    if (error) {
      result.textContent =
        '❌ ' +
        error.message

      return
    }

    result.textContent =
      `✅ ${quantity} atendimento(s) agendado(s)!`

    setTimeout(() => {
      form.style.display = 'none'
      renderAgenda()
    }, 900)
  }
}

/* =========================================================
   PACIENTES
========================================================= */

async function getPatients() {
  let query =
    supabase
      .from('patients')
      .select('*')
      .order('name')

  if (isProfessional()) {
    query =
      query.eq(
        'professional_id',
        currentProfile.id
      )
  } else {
    query =
      query.eq(
        'clinic_id',
        currentProfile.clinic_id
      )
  }

  const {
    data,
    error
  } = await query

  if (error) {
    console.error(
      'Erro ao carregar pacientes:',
      error
    )

    return []
  }

  return data || []
}
/* =========================================================
   PACIENTES — LISTA, CADASTRO E EDIÇÃO
========================================================= */

async function renderPatients() {
  const container =
    document.querySelector(
      '#page-content'
    )

  const patients =
    await getPatients()

  const professionals =
    await getProfessionals()

  const professionalMap = {}

  professionals.forEach(
    professional => {
      professionalMap[
        professional.id
      ] = professional.name
    }
  )

  container.innerHTML = `
    <div class="box">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          flex-wrap:wrap;
        "
      >

        <h3>
          👥 Pacientes
        </h3>

        ${
          canManagePatientData()
            ? `
              <button
                id="novo-paciente"
                class="fg-btn primary"
              >
                ➕ Cadastrar paciente
              </button>
            `
            : ''
        }

      </div>

      <div
        id="form-paciente"
        style="
          display:none;
          margin-top:20px;
        "
      ></div>

      ${
        patients.length
          ? `
            <div
              style="
                margin-top:20px;
                display:grid;
                gap:10px;
              "
            >

              ${
                patients
                  .map(
                    patient => `
                      <div class="appointment">

                        <div
                          class="fg-patient-actions"
                          style="
                            justify-content:space-between;
                            align-items:flex-start;
                          "
                        >

                          <div>

                            <strong>
                              ${escapeHtml(
                                patient.name
                              )}
                            </strong>

                            ${
                              patient.cpf
                                ? `
                                  <div>
                                    🪪 CPF:
                                    ${escapeHtml(
                                      patient.cpf
                                    )}
                                  </div>
                                `
                                : ''
                            }

                            ${
                              patient.birth_date
                                ? `
                                  <div>
                                    🎂 Nascimento:
                                    ${formatDate(
                                      patient.birth_date
                                    )}
                                  </div>
                                `
                                : ''
                            }

                            ${
                              patient.guardian
                                ? `
                                  <div>
                                    👨‍👩‍👧 Responsável:
                                    ${escapeHtml(
                                      patient.guardian
                                    )}
                                  </div>
                                `
                                : ''
                            }

                            ${
                              patient.phone
                                ? `
                                  <div>
                                    📱 Telefone:
                                    ${escapeHtml(
                                      patient.phone
                                    )}
                                  </div>
                                `
                                : ''
                            }

                            ${
                              patient.professional_id
                                ? `
                                  <div
                                    class="fg-muted"
                                  >
                                    👩‍⚕️
                                    ${escapeHtml(
                                      professionalMap[
                                        patient.professional_id
                                      ] ||
                                      'Profissional'
                                    )}
                                  </div>
                                `
                                : ''
                            }

                          </div>

                          <div
                            class="fg-patient-actions"
                          >

                            ${
                              canManagePatientData()
                                ? `
                                  <button
                                    class="fg-btn secondary editar-paciente"
                                    data-id="${patient.id}"
                                  >
                                    ✏️ Editar
                                  </button>
                                `
                                : ''
                            }

                            ${
                              canWriteEvolution()
                                ? `
                                  <button
                                    class="fg-btn primary nova-evolucao-paciente"
                                    data-id="${patient.id}"
                                  >
                                    📝 Nova evolução
                                  </button>
                                `
                                : ''
                            }

                            ${
                              canManageAppointments()
                                ? `
                                  <button
                                    class="fg-btn secondary agendar-paciente"
                                    data-id="${patient.id}"
                                  >
                                    📅 Agendar
                                  </button>
                                `
                                : ''
                            }

                            <button
                              class="fg-btn secondary ver-historico-paciente"
                              data-id="${patient.id}"
                            >
                              📖 Prontuário
                            </button>

                          </div>

                        </div>

                      </div>
                    `
                  )
                  .join('')
              }

            </div>
          `
          : `
            <p>
              Nenhum paciente cadastrado.
            </p>
          `
      }

    </div>
  `

  const novoPaciente =
    document.querySelector(
      '#novo-paciente'
    )

  if (novoPaciente) {
    novoPaciente.onclick = () => {
      mostrarFormularioPaciente(
        professionals
      )
    }
  }

  document
    .querySelectorAll(
      '.editar-paciente'
    )
    .forEach(
      button => {

        button.onclick = async () => {

          const patient =
            patients.find(
              item =>
                String(item.id) ===
                String(
                  button.dataset.id
                )
            )

          if (!patient) return

          mostrarFormularioPaciente(
            professionals,
            patient
          )
        }

      }
    )

  document
    .querySelectorAll(
      '.nova-evolucao-paciente'
    )
    .forEach(
      button => {

        button.onclick = async () => {

          const patient =
            patients.find(
              item =>
                String(item.id) ===
                String(
                  button.dataset.id
                )
            )

          if (!patient) return

          await mostrarFormularioEvolucao(
            patient
          )
        }

      }
    )

  document
    .querySelectorAll(
      '.agendar-paciente'
    )
    .forEach(
      button => {

        button.onclick = async () => {

          const patient =
            patients.find(
              item =>
                String(item.id) ===
                String(
                  button.dataset.id
                )
            )

          if (!patient) return

          const form =
            document.querySelector(
              '#form-paciente'
            )

          form.style.display =
            'block'

          const professionalsAtual =
            await getProfessionals()

          mostrarFormularioAgendamento(
            professionalsAtual,
            null,
            patient.id
          )
        }

      }
    )

  document
    .querySelectorAll(
      '.ver-historico-paciente'
    )
    .forEach(
      button => {

        button.onclick = async () => {

          const patient =
            patients.find(
              item =>
                String(item.id) ===
                String(
                  button.dataset.id
                )
            )

          if (!patient) return

          await mostrarHistoricoPaciente(
            patient
          )
        }

      }
    )
}

/* =========================================================
   FORMULÁRIO DE PACIENTE
========================================================= */

function mostrarFormularioPaciente(
  professionals,
  patient = null
) {
  const form =
    document.querySelector(
      '#form-paciente'
    )

  if (!form) return

  const editing =
    Boolean(patient)

  form.style.display = 'block'

  form.innerHTML = `
    <div class="box">

      <h3>
        ${
          editing
            ? '✏️ Editar paciente'
            : '👤 Novo paciente'
        }
      </h3>

      <div class="fg-form-grid">

        <div class="fg-full">
          <label>
            Nome completo
          </label>

          <input
            id="paciente-nome"
            type="text"
            value="${
              escapeHtml(
                patient?.name || ''
              )
            }"
            placeholder="Nome completo"
          >
        </div>

        <div>
          <label>
            CPF
          </label>

          <input
            id="paciente-cpf"
            type="text"
            value="${
              escapeHtml(
                patient?.cpf || ''
              )
            }"
            placeholder="CPF"
            maxlength="14"
          >
        </div>

        <div>
          <label>
            Data de nascimento
          </label>

          <input
            id="paciente-nascimento"
            type="date"
            value="${
              patient?.birth_date || ''
            }"
          >
        </div>

        <div>
          <label>
            Responsável
          </label>

          <input
            id="paciente-responsavel"
            type="text"
            value="${
              escapeHtml(
                patient?.guardian || ''
              )
            }"
            placeholder="Nome do responsável"
          >
        </div>

        <div>
          <label>
            Telefone
          </label>

          <input
            id="paciente-telefone"
            type="text"
            value="${
              escapeHtml(
                patient?.phone || ''
              )
            }"
            placeholder="Telefone"
          >
        </div>

        <div>
          <label>
            Profissional responsável
          </label>

          <select
            id="paciente-profissional"
          >

            <option value="">
              Selecione
            </option>

            ${
              professionals
                .map(
                  professional => `
                    <option
                      value="${professional.id}"
                      ${
                        (
                          patient?.professional_id ||
                          (
                            !isManager()
                              ? currentProfile.id
                              : ''
                          )
                        ) ===
                        professional.id
                          ? 'selected'
                          : ''
                      }
                    >
                      ${escapeHtml(
                        professional.name
                      )}
                    </option>
                  `
                )
                .join('')
            }

          </select>
        </div>

        <div class="fg-full">

          <label>
            Observações
          </label>

          <textarea
            id="paciente-observacoes"
            placeholder="Observações clínicas ou administrativas"
          >${
            escapeHtml(
              patient?.notes || ''
            )
          }</textarea>

        </div>

        <div
          class="fg-full"
          style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
          "
        >

          <button
            id="salvar-paciente"
            class="fg-btn primary"
          >
            💾
            ${
              editing
                ? 'Salvar alterações'
                : 'Cadastrar paciente'
            }
          </button>

          ${
            editing
              ? `
                <button
                  id="novo-evolucao-paciente-form"
                  class="fg-btn secondary"
                >
                  📝 Nova evolução
                </button>
              `
              : ''
          }

          <button
            id="cancelar-paciente"
            class="fg-btn secondary"
          >
            Cancelar
          </button>

        </div>

        <div
          id="resultado-paciente"
          class="fg-full"
        ></div>

      </div>

    </div>
  `

  document.querySelector(
    '#cancelar-paciente'
  ).onclick = () => {
    form.style.display = 'none'
  }

  const novaEvolucao =
    document.querySelector(
      '#novo-evolucao-paciente-form'
    )

  if (novaEvolucao && patient) {
    novaEvolucao.onclick = async () => {
      await mostrarFormularioEvolucao(
        patient
      )
    }
  }

  document.querySelector(
    '#salvar-paciente'
  ).onclick = async () => {

    const name =
      document.querySelector(
        '#paciente-nome'
      ).value.trim()

    const cpf =
      document.querySelector(
        '#paciente-cpf'
      ).value.trim()

    const birthDate =
      document.querySelector(
        '#paciente-nascimento'
      ).value || null

    const guardian =
      document.querySelector(
        '#paciente-responsavel'
      ).value.trim()

    const phone =
      document.querySelector(
        '#paciente-telefone'
      ).value.trim()

    const professionalId =
      document.querySelector(
        '#paciente-profissional'
      ).value

    const notes =
      document.querySelector(
        '#paciente-observacoes'
      ).value.trim()

    const result =
      document.querySelector(
        '#resultado-paciente'
      )

    if (!name) {
      result.textContent =
        '⚠️ Informe o nome do paciente.'

      return
    }

    if (!professionalId) {
      result.textContent =
        '⚠️ Selecione a profissional responsável.'

      return
    }

    result.textContent =
      '⏳ Salvando...'

    if (editing) {

      const {
        error
      } = await supabase
        .from('patients')
        .update({
          name,
          cpf:
            cpf || null,
          birth_date:
            birthDate,
          guardian:
            guardian || null,
          phone:
            phone || null,
          notes:
            notes || null,
          professional_id:
            professionalId
        })
        .eq(
          'id',
          patient.id
        )

      if (error) {
        result.textContent =
          '❌ ' +
          error.message

        return
      }

      result.textContent =
        '✅ Paciente atualizado!'

      setTimeout(
        () => {
          renderPatients()
        },
        700
      )

      return
    }

    const {
      data,
      error
    } = await supabase
      .from('patients')
      .insert({
        name,
        cpf:
          cpf || null,
        birth_date:
          birthDate,
        guardian:
          guardian || null,
        phone:
          phone || null,
        notes:
          notes || null,
        professional_id:
          professionalId,
        clinic_id:
          currentProfile.clinic_id
      })
      .select()
      .single()

    if (error) {
      result.textContent =
        '❌ ' +
        error.message

      return
    }

    result.textContent =
      '✅ Paciente cadastrado!'

    setTimeout(
      () => {
        renderPatients()
      },
      700
    )
  }
}

/* =========================================================
   PRONTUÁRIO DO PACIENTE
========================================================= */

async function mostrarHistoricoPaciente(
  patient
) {
  const container =
    document.querySelector(
      '#page-content'
    )

  const {
    data: evolutions,
    error
  } = await supabase
    .from('evolutions')
    .select('*')
    .eq(
      'patient_id',
      patient.id
    )
    .order(
      'evolution_date',
      {
        ascending:false
      }
    )
    .order(
      'evolution_time',
      {
        ascending:false
      }
    )

  if (error) {
    container.innerHTML = `
      <div class="box">
        ❌
        ${escapeHtml(
          error.message
        )}
      </div>
    `

    return
  }

  container.innerHTML = `
    <div class="box">

      <div
        class="fg-toolbar"
        style="justify-content:space-between;"
      >

        <div>
          <h3>
            📖 Prontuário
          </h3>

          <strong>
            ${escapeHtml(
              patient.name
            )}
          </strong>
        </div>

        <div class="fg-patient-actions">

          ${
            canManagePatientData()
              ? `
                <button
                  id="prontuario-editar"
                  class="fg-btn secondary"
                >
                  ✏️ Editar paciente
                </button>
              `
              : ''
          }

          ${
            canWriteEvolution()
              ? `
                <button
                  id="prontuario-nova-evolucao"
                  class="fg-btn primary"
                >
                  📝 Nova evolução
                </button>
              `
              : ''
          }

          <button
            id="prontuario-voltar"
            class="fg-btn secondary"
          >
            ← Voltar
          </button>

        </div>

      </div>

      <div
        class="fg-modal-section"
      >

        <h4>
          Dados do paciente
        </h4>

        ${
          patient.cpf
            ? `
              <p>
                🪪 CPF:
                ${escapeHtml(
                  patient.cpf
                )}
              </p>
            `
            : ''
        }

        ${
          patient.birth_date
            ? `
              <p>
                🎂 Nascimento:
                ${formatDate(
                  patient.birth_date
                )}
              </p>
            `
            : ''
        }

        ${
          patient.guardian
            ? `
              <p>
                👨‍👩‍👧 Responsável:
                ${escapeHtml(
                  patient.guardian
                )}
              </p>
            `
            : ''
        }

        ${
          patient.phone
            ? `
              <p>
                📱 Telefone:
                ${escapeHtml(
                  patient.phone
                )}
              </p>
            `
            : ''
        }

        ${
          patient.notes
            ? `
              <p>
                🗒️ Observações:
                ${escapeHtml(
                  patient.notes
                )}
              </p>
            `
            : ''
        }

      </div>

      <div
        class="fg-modal-section"
      >

        <h4>
          📝 Histórico de evoluções
        </h4>

        ${
          evolutions?.length
            ? evolutions
                .map(
                  evolution => `
                    <div
                      class="appointment"
                      style="margin-bottom:10px;"
                    >

                      <strong>
                        ${formatDate(
                          evolution.evolution_date
                        )}

                        ${
                          evolution.evolution_time
                            ? ` às ${evolution.evolution_time.slice(0,5)}`
                            : ''
                        }
                      </strong>

                      <p>
                        ${escapeHtml(
                          evolution.text || ''
                        )}
                      </p>

                      <small>
                        Status:
                        ${escapeHtml(
                          evolution.status || ''
                        )}
                      </small>

                      ${
                        evolution.supervisor_feedback
                          ? `
                            <p>
                              <strong>
                                Feedback da supervisão:
                              </strong>

                              ${escapeHtml(
                                evolution.supervisor_feedback
                              )}
                            </p>
                          `
                          : ''
                      }

                    </div>
                  `
                )
                .join('')
            : `
              <p>
                Nenhuma evolução cadastrada.
              </p>
            `
        }

      </div>

    </div>
  `

  document.querySelector(
    '#prontuario-voltar'
  ).onclick = () => {
    renderPatients()
  }

  const editar =
    document.querySelector(
      '#prontuario-editar'
    )

  if (editar) {
    editar.onclick = async () => {

      const professionals =
        await getProfessionals()

      mostrarFormularioPaciente(
        professionals,
        patient
      )
    }
  }

  const nova =
    document.querySelector(
      '#prontuario-nova-evolucao'
    )

  if (nova) {
    nova.onclick = async () => {
      await mostrarFormularioEvolucao(
        patient
      )
    }
  }
}

/* =========================================================
   EVOLUÇÕES — NOVA EVOLUÇÃO
========================================================= */

async function mostrarFormularioEvolucao(
  patient
) {
  const container =
    document.querySelector(
      '#page-content'
    )

  const professionals =
    await getProfessionals()

  container.innerHTML = `
    <div class="box">

      <h3>
        📝 Nova evolução
      </h3>

      <p>
        Paciente:
        <strong>
          ${escapeHtml(
            patient.name
          )}
        </strong>
      </p>

      <div class="fg-form-grid">

        <div>
          <label>
            Data
          </label>

          <input
            id="evolucao-data"
            type="date"
            value="${dateInputValue(
              new Date()
            )}"
          >
        </div>

        <div>
          <label>
            Horário
          </label>

          <input
            id="evolucao-horario"
            type="time"
            value="${new Date()
              .toTimeString()
              .slice(0,5)}"
          >
        </div>

        ${
          isManager()
            ? `
              <div>
                <label>
                  Profissional
                </label>

                <select
                  id="evolucao-profissional"
                >

                  ${
                    professionals
                      .map(
                        professional => `
                          <option
                            value="${professional.id}"
                            ${
                              professional.id ===
                              (
                                patient.professional_id ||
                                currentProfile.id
                              )
                                ? 'selected'
                                : ''
                            }
                          >
                            ${escapeHtml(
                              professional.name
                            )}
                          </option>
                        `
                      )
                      .join('')
                  }

                </select>

              </div>
            `
            : ''
        }

        <div class="fg-full">

          <label>
            Evolução fonoaudiológica
          </label>

          <textarea
            id="evolucao-texto"
            placeholder="Descreva o atendimento, objetivos, atividades realizadas, respostas do paciente e orientações."
          ></textarea>

        </div>

        <div>

          <label>
            Status
          </label>

          <select
            id="evolucao-status"
          >
            <option value="rascunho">
              Rascunho
            </option>

            <option value="concluida">
              Concluída
            </option>
          </select>

        </div>

        <div
          class="fg-full"
          style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
          "
        >

          <button
            id="salvar-evolucao"
            class="fg-btn primary"
          >
            💾 Salvar evolução
          </button>

          <button
            id="cancelar-evolucao"
            class="fg-btn secondary"
          >
            Cancelar
          </button>

        </div>

        <div
          id="resultado-evolucao"
          class="fg-full"
        ></div>

      </div>

    </div>
  `

  document.querySelector(
    '#cancelar-evolucao'
  ).onclick = () => {
    renderPatients()
  }

  document.querySelector(
    '#salvar-evolucao'
  ).onclick = async () => {

    const evolutionDate =
      document.querySelector(
        '#evolucao-data'
      ).value

    const evolutionTime =
      document.querySelector(
        '#evolucao-horario'
      ).value

    const text =
      document.querySelector(
        '#evolucao-texto'
      ).value.trim()

    const status =
      document.querySelector(
        '#evolucao-status'
      ).value

    const professionalElement =
      document.querySelector(
        '#evolucao-profissional'
      )

    const professionalId =
      professionalElement
        ? professionalElement.value
        : (
            patient.professional_id ||
            currentProfile.id
          )

    const result =
      document.querySelector(
        '#resultado-evolucao'
      )

    if (!evolutionDate) {
      result.textContent =
        '⚠️ Informe a data.'

      return
    }

    if (!text) {
      result.textContent =
        '⚠️ Escreva a evolução.'

      return
    }

    result.textContent =
      '⏳ Salvando...'

    const {
      error
    } = await supabase
      .from('evolutions')
      .insert({

        patient_id:
          patient.id,

        professional_id:
          professionalId,

        clinic_id:
          currentProfile.clinic_id,

        evolution_date:
          evolutionDate,

        evolution_time:
          evolutionTime || null,

        text,

        status

      })

    if (error) {
      result.textContent =
        '❌ ' +
        error.message

      return
    }

    result.textContent =
      '✅ Evolução salva!'

    setTimeout(
      () => {
        mostrarHistoricoPaciente(
          patient
        )
      },
      700
    )
  }
}

/* =========================================================
   LISTAGEM DE EVOLUÇÕES
========================================================= */

async function renderEvolutions() {
  const container =
    document.querySelector(
      '#page-content'
    )

  let query =
    supabase
      .from('evolutions')
      .select('*')
      .order(
        'evolution_date',
        {
          ascending:false
        }
      )
      .order(
        'evolution_time',
        {
          ascending:false
        }
      )

  if (isProfessional()) {
    query =
      query.eq(
        'professional_id',
        currentProfile.id
      )
  } else {
    query =
      query.eq(
        'clinic_id',
        currentProfile.clinic_id
      )
  }

  const {
    data,
    error
  } = await query

  if (error) {
    container.innerHTML = `
      <div class="box">
        ❌
        ${escapeHtml(
          error.message
        )}
      </div>
    `

    return
  }

  const patientIds = [
    ...new Set(
      (data || [])
        .map(
          evolution =>
            evolution.patient_id
        )
        .filter(Boolean)
    )
  ]

  let patientsMap = {}

  if (patientIds.length) {

    const {
      data: patients
    } = await supabase
      .from('patients')
      .select(
        'id,name'
      )
      .in(
        'id',
        patientIds
      )

    ;(patients || []).forEach(
      patient => {
        patientsMap[
          patient.id
        ] = patient.name
      }
    )
  }

  container.innerHTML = `
    <div class="box">

      <div
        class="fg-toolbar"
        style="justify-content:space-between;"
      >

        <h3>
          📝 Evoluções
        </h3>

      </div>

      ${
        data?.length
          ? data
              .map(
                evolution => `
                  <div
                    class="appointment"
                    style="margin-bottom:10px;"
                  >

                    <strong>
                      ${
                        escapeHtml(
                          patientsMap[
                            evolution.patient_id
                          ] ||
                          'Paciente'
                        )
                      }
                    </strong>

                    <div>
                      ${formatDate(
                        evolution.evolution_date
                      )}

                      ${
                        evolution.evolution_time
                          ? ` às ${evolution.evolution_time.slice(0,5)}`
                          : ''
                      }
                    </div>

                    <p>
                      ${escapeHtml(
                        evolution.text || ''
                      )}
                    </p>

                    <small>
                      Status:
                      ${escapeHtml(
                        evolution.status || ''
                      )}
                    </small>

                  </div>
                `
              )
              .join('')
          : `
            <p>
              Nenhuma evolução cadastrada.
            </p>
          `
      }

    </div>
  `
}
/* =========================================================
   EQUIPE
========================================================= */

async function renderTeam() {
  const container =
    document.querySelector(
      '#page-content'
    )

  if (!isManager()) {
    container.innerHTML = `
      <div class="box">
        Acesso não autorizado.
      </div>
    `

    return
  }

  const professionals =
    await getProfessionals()

  container.innerHTML = `
    <div class="box">

      <div
        class="fg-toolbar"
        style="justify-content:space-between;"
      >

        <div>
          <h3>
            👩‍⚕️ Equipe
          </h3>

          <p class="fg-muted">
            Profissionais cadastrados na clínica.
          </p>
        </div>

      </div>

      ${
        professionals.length
          ? professionals
              .map(
                professional => `
                  <div
                    class="appointment"
                    style="margin-bottom:10px;"
                  >

                    <strong>
                      👩‍⚕️
                      ${escapeHtml(
                        professional.name
                      )}
                    </strong>

                    <div>
                      ${roleLabel(
                        professional.role
                      )}
                    </div>

                    ${
                      professional.active
                        ? `
                          <small>
                            🟢 Ativa
                          </small>
                        `
                        : `
                          <small>
                            🔴 Inativa
                          </small>
                        `
                    }

                  </div>
                `
              )
              .join('')
          : `
            <p>
              Nenhuma profissional cadastrada.
            </p>
          `
      }

      <p
        class="fg-muted"
        style="margin-top:20px;"
      >
        O cadastro de novas contas profissionais
        continua sendo realizado pelo cadastro
        administrativo configurado no sistema.
      </p>

    </div>
  `
}

/* =========================================================
   SUPERVISÃO
========================================================= */

async function renderSupervision() {
  const container =
    document.querySelector(
      '#page-content'
    )

  if (!isManager()) {
    container.innerHTML = `
      <div class="box">
        Acesso não autorizado.
      </div>
    `

    return
  }

  const professionals =
    await getProfessionals()

  container.innerHTML = `
    <div class="box">

      <h3>
        🔎 Área da supervisão
      </h3>

      <p>
        Visualize a agenda de cada profissional.
      </p>

      <div
        style="
          display:grid;
          gap:10px;
          margin-top:20px;
        "
      >

        ${
          professionals.length
            ? professionals
                .map(
                  professional => `
                    <div
                      class="appointment"
                      style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                        flex-wrap:wrap;
                      "
                    >

                      <div>

                        <strong>
                          👩‍⚕️
                          ${escapeHtml(
                            professional.name
                          )}
                        </strong>

                        <div class="fg-muted">
                          ${roleLabel(
                            professional.role
                          )}
                        </div>

                      </div>

                      <button
                        class="fg-btn primary ver-agenda-profissional"
                        data-professional-id="${professional.id}"
                      >
                        📅 Ver agenda
                      </button>

                    </div>
                  `
                )
                .join('')
            : `
              <p>
                Nenhuma profissional cadastrada.
              </p>
            `
        }

      </div>

    </div>
  `

  document
    .querySelectorAll(
      '.ver-agenda-profissional'
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            activeProfessionalFilter =
              button.dataset.professionalId

            await show(
              'agenda'
            )

            await renderAgendaFiltrada(
              button.dataset
                .professionalId
            )
          }
      }
    )
}

/* =========================================================
   RECUPERAÇÃO DE SENHA
========================================================= */

supabase.auth.onAuthStateChange(
  async event => {

    if (
      event ===
      'PASSWORD_RECOVERY'
    ) {

      app.innerHTML = `
        <main class="login">

          <div class="box">

            <h1>
              🔐 Nova senha
            </h1>

            <p>
              Cadastre sua nova senha.
            </p>

            <input
              id="nova-senha"
              type="password"
              placeholder="Nova senha"
            >

            <input
              id="confirmar-senha"
              type="password"
              placeholder="Confirmar nova senha"
            >

            <button
              id="salvar-senha"
            >
              Salvar nova senha
            </button>

            <div
              id="resultado-senha"
            ></div>

          </div>

        </main>
      `

      document.querySelector(
        '#salvar-senha'
      ).onclick =
        async () => {

          const password =
            document.querySelector(
              '#nova-senha'
            ).value

          const confirmation =
            document.querySelector(
              '#confirmar-senha'
            ).value

          const result =
            document.querySelector(
              '#resultado-senha'
            )

          if (
            password.length < 6
          ) {
            result.textContent =
              '⚠️ A senha precisa ter pelo menos 6 caracteres.'

            return
          }

          if (
            password !==
            confirmation
          ) {
            result.textContent =
              '⚠️ As senhas não conferem.'

            return
          }

          result.textContent =
            '⏳ Salvando...'

          const {
            error
          } =
            await supabase.auth
              .updateUser({
                password
              })

          if (error) {
            result.textContent =
              '❌ ' +
              error.message

            return
          }

          result.textContent =
            '✅ Senha alterada com sucesso!'

          setTimeout(
            () => {
              start()
            },
            1000
          )
        }
    }
  }
)

/* =========================================================
   ESTILOS E INICIALIZAÇÃO
========================================================= */

injectFonoGestaoEnhancements()

start()
