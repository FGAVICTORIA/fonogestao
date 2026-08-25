import { createClient } from '@supabase/supabase-js'
import './style.css'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(url, key)

const app = document.querySelector('#app')
const SITE_URL = 'https://fonogestao-seven.vercel.app'

let currentProfile = null
let currentWeek = new Date()

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
    return null
  }

  const { data, error } =
    await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  return data
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

  document.querySelectorAll('.nav').forEach(button => {
    button.onclick = () =>
      show(button.dataset.page)
  })

  show('agenda')
}

/* =========================================================
   NAVEGAÇÃO
========================================================= */

async function show(page) {
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
      'Profissionais cadastrados no FonoGestão.'
    ],

    supervision: [
      '🔎 Supervisão',
      'Acompanhe as agendas e evoluções da clínica.'
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
   AGENDA
========================================================= */

async function renderAgenda() {
  const container =
    document.querySelector('#page-content')

  const professionals =
    await getProfessionals()

  const weekDates = getWeekDates()

  const firstDate =
    dateInputValue(weekDates[0])

  const lastDate =
    dateInputValue(weekDates[6])

  let query =
    supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', firstDate)
      .lte('appointment_date', lastDate)
      .order('appointment_date')
      .order('start_time')

  if (isProfessional()) {
    query = query.eq(
      'professional_id',
      currentProfile.id
    )
  }

  const { data: appointments, error } =
    await query

  if (error) {
    container.innerHTML =
      `<div class="box">❌ ${escapeHtml(error.message)}</div>`
    return
  }

  const patientIds =
    [...new Set(
      (appointments || [])
        .map(a => a.patient_id)
        .filter(Boolean)
    )]

  let patientsMap = {}

  if (patientIds.length) {
    const { data: patients } =
      await supabase
        .from('patients')
        .select('id,name,cpf')
        .in('id', patientIds)

    ;(patients || []).forEach(patient => {
      patientsMap[patient.id] = patient
    })
  }

  const professionalMap = {}

  professionals.forEach(professional => {
    professionalMap[professional.id] =
      professional.name
  })

  container.innerHTML = `
    <div class="box">

      <div class="toolbar">

        <button id="hoje">
          Hoje
        </button>

        <button id="anterior">
          ‹
        </button>

        <strong>
          ${formatDate(firstDate)}
          —
          ${formatDate(lastDate)}
        </strong>

        <button id="proxima">
          ›
        </button>

        ${
          isManager()
            ? `
              <select id="filtro-profissional">
                <option value="">
                  Todas as profissionais
                </option>

                ${professionals.map(p => `
                  <option value="${p.id}">
                    ${escapeHtml(p.name)}
                  </option>
                `).join('')}
              </select>
            `
            : `
              <span>
                ${escapeHtml(currentProfile.name)}
              </span>
            `
        }

        <button id="novo-agendamento">
          ➕ Agendar
        </button>

      </div>

      <div
        id="form-agendamento"
        style="display:none; margin:20px 0;"
      ></div>

      <div class="calendar">

        ${weekDates.map(date => {

          const dateValue =
            dateInputValue(date)

          let dayAppointments =
            (appointments || [])
              .filter(a =>
                a.appointment_date === dateValue
              )

          return `
            <div class="calendar-day">

              <h3>
                ${date.toLocaleDateString(
                  'pt-BR',
                  {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit'
                  }
                )}
              </h3>

              ${
                dayAppointments.length
                  ? dayAppointments.map(a => {

                      const patient =
                        patientsMap[a.patient_id]

                      return `
                        <div class="appointment">

                          <strong>
                            ${a.start_time?.slice(0,5)}
                            ${
                              a.end_time
                                ? ` - ${a.end_time.slice(0,5)}`
                                : ''
                            }
                          </strong>

                          <div>
                            ${
                              escapeHtml(
                                patient?.name ||
                                'Paciente'
                              )
                            }
                          </div>

                          ${
                            patient?.cpf
                              ? `
                                <small>
                                  CPF:
                                  ${escapeHtml(patient.cpf)}
                                </small>
                              `
                              : ''
                          }

                          ${
                            isManager()
                              ? `
                                <small>
                                  👩‍⚕️
                                  ${escapeHtml(
                                    professionalMap[
                                      a.professional_id
                                    ] || ''
                                  )}
                                </small>
                              `
                              : ''
                          }

                          <small>
                            ${a.status}
                          </small>

                        </div>
                      `
                    }).join('')
                  : `
                    <div class="empty">
                      Nenhum atendimento
                    </div>
                  `
              }

            </div>
          `
        }).join('')}

      </div>

    </div>
  `

  document.querySelector('#hoje').onclick =
    () => {
      currentWeek = new Date()
      renderAgenda()
    }

  document.querySelector('#anterior').onclick =
    () => {
      currentWeek.setDate(
        currentWeek.getDate() - 7
      )
      renderAgenda()
    }

  document.querySelector('#proxima').onclick =
    () => {
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
      const value = filtro.value

      document
        .querySelectorAll('.appointment')
        .forEach(() => {})

      renderAgendaFiltrada(value)
    }
  }

  document.querySelector(
    '#novo-agendamento'
  ).onclick = () => {
    mostrarFormularioAgendamento(
      professionals
    )
  }
}

/* =========================================================
   FILTRO DA AGENDA
========================================================= */

async function renderAgendaFiltrada(
  professionalId
) {
  const container =
    document.querySelector('#page-content')

  const professionals =
    await getProfessionals()

  const weekDates = getWeekDates()

  const firstDate =
    dateInputValue(weekDates[0])

  const lastDate =
    dateInputValue(weekDates[6])

  let query =
    supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', firstDate)
      .lte('appointment_date', lastDate)
      .order('appointment_date')
      .order('start_time')

  if (professionalId) {
    query = query.eq(
      'professional_id',
      professionalId
    )
  }

  const { data: appointments } =
    await query

  const patientIds =
    [...new Set(
      (appointments || [])
        .map(a => a.patient_id)
        .filter(Boolean)
    )]

  let patientsMap = {}

  if (patientIds.length) {
    const { data: patients } =
      await supabase
        .from('patients')
        .select('id,name,cpf')
        .in('id', patientIds)

    ;(patients || []).forEach(p => {
      patientsMap[p.id] = p
    })
  }

  const professionalMap = {}

  professionals.forEach(p => {
    professionalMap[p.id] = p.name
  })

  const appointmentElements =
    document.querySelectorAll('.calendar-day')

  appointmentElements.forEach(dayElement => {
    const dateText =
      dayElement.dataset?.date
  })

  await renderAgendaComFiltro(
    professionalId,
    appointments,
    patientsMap,
    professionalMap
  )
}

async function renderAgendaComFiltro(
  professionalId,
  appointments,
  patientsMap,
  professionalMap
) {
  const weekDates = getWeekDates()

  const days =
    document.querySelectorAll('.calendar-day')

  days.forEach((dayElement, index) => {

    const dateValue =
      dateInputValue(weekDates[index])

    const list =
      appointments.filter(
        a => a.appointment_date === dateValue
      )

    dayElement.innerHTML = `
      <h3>
        ${weekDates[index].toLocaleDateString(
          'pt-BR',
          {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit'
          }
        )}
      </h3>

      ${
        list.length
          ? list.map(a => `
              <div class="appointment">

                <strong>
                  ${a.start_time?.slice(0,5)}
                  ${
                    a.end_time
                      ? ` - ${a.end_time.slice(0,5)}`
                      : ''
                  }
                </strong>

                <div>
                  ${escapeHtml(
                    patientsMap[a.patient_id]?.name ||
                    'Paciente'
                  )}
                </div>

                ${
                  patientsMap[a.patient_id]?.cpf
                    ? `
                      <small>
                        CPF:
                        ${escapeHtml(
                          patientsMap[
                            a.patient_id
                          ].cpf
                        )}
                      </small>
                    `
                    : ''
                }

                ${
                  isManager()
                    ? `
                      <small>
                        👩‍⚕️
                        ${escapeHtml(
                          professionalMap[
                            a.professional_id
                          ] || ''
                        )}
                      </small>
                    `
                    : ''
                }

              </div>
            `
          ).join('')
          : `
            <div class="empty">
              Nenhum atendimento
            </div>
          `
      }
    `
  })
}

/* =========================================================
   FORMULÁRIO DE AGENDAMENTO
========================================================= */

async function mostrarFormularioAgendamento(
  professionals
) {
  const form =
    document.querySelector(
      '#form-agendamento'
    )

  const patients =
    await getPatients()

  form.style.display = 'block'

  form.innerHTML = `
    <div class="box">

      <h3>📅 Novo agendamento</h3>

      <label>Paciente</label>

      <select id="ag-paciente">
        <option value="">
          Selecione o paciente
        </option>

        ${patients.map(p => `
          <option value="${p.id}">
            ${escapeHtml(p.name)}
          </option>
        `).join('')}
      </select>

      ${
        isManager()
          ? `
            <label>Profissional</label>

            <select id="ag-profissional">

              ${professionals.map(p => `
                <option value="${p.id}">
                  ${escapeHtml(p.name)}
                </option>
              `).join('')}

            </select>
          `
          : `
            <input
              type="hidden"
              id="ag-profissional"
              value="${currentProfile.id}"
            >
          `
      }

      <label>Data</label>

      <input
        id="ag-data"
        type="date"
        value="${dateInputValue(new Date())}"
      >

      <label>Horário de início</label>

      <input
        id="ag-inicio"
        type="time"
      >

      <label>Horário de término</label>

      <input
        id="ag-fim"
        type="time"
      >

      <button id="salvar-agendamento">
        💾 Salvar agendamento
      </button>

      <button id="fechar-agendamento">
        Cancelar
      </button>

      <div
        id="resultado-agendamento"
        style="margin-top:10px;"
      ></div>

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

    result.textContent =
      '⏳ Salvando...'

    const { error } =
      await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          professional_id: professionalId,
          appointment_date: date,
          start_time: startTime,
          end_time: endTime || null,
          status: 'agendado',
          clinic_id: currentProfile.clinic_id
        })

    if (error) {
      result.textContent =
        '❌ ' + error.message
      return
    }

    result.textContent =
      '✅ Agendamento salvo!'

    setTimeout(() => {
      form.style.display = 'none'
      renderAgenda()
    }, 700)
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
    query = query.eq(
      'professional_id',
      currentProfile.id
    )
  }

  const { data, error } =
    await query

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

async function renderPatients() {
  const container =
    document.querySelector('#page-content')

  const patients =
    await getPatients()

  const professionals =
    await getProfessionals()

  const professionalMap = {}

  professionals.forEach(p => {
    professionalMap[p.id] = p.name
  })

  container.innerHTML = `
    <div class="box">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
        "
      >

        <h3>👥 Meus pacientes</h3>

        <button id="novo-paciente">
          ➕ Cadastrar paciente
        </button>

      </div>

      <div
        id="form-paciente"
        style="display:none; margin-top:20px;"
      ></div>

      ${
        patients.length
          ? `
            <div style="margin-top:20px;">

              ${patients.map(p => `
                <div class="appointment">

                  <strong>
                    ${escapeHtml(p.name)}
                  </strong>

                  ${
                    p.cpf
                      ? `
                        <div>
                          CPF:
                          ${escapeHtml(p.cpf)}
                        </div>
                      `
                      : ''
                  }

                  ${
                    p.birth_date
                      ? `
                        <div>
                          Nascimento:
                          ${formatDate(p.birth_date)}
                        </div>
                      `
                      : ''
                  }

                  ${
                    isManager()
                      ? `
                        <small>
                          👩‍⚕️
                          ${escapeHtml(
                            professionalMap[
                              p.professional_id
                            ] || 'Sem profissional'
                          )}
                        </small>
                      `
                      : ''
                  }

                </div>
              `).join('')}

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

  document.querySelector(
    '#novo-paciente'
  ).onclick = () =>
    mostrarFormularioPaciente(
      professionals
    )
}

/* =========================================================
   FORMULÁRIO DE PACIENTE
========================================================= */

function mostrarFormularioPaciente(
  professionals
) {
  const form =
    document.querySelector(
      '#form-paciente'
    )

  form.style.display = 'block'

  form.innerHTML = `
    <div class="box">

      <h3>👤 Novo paciente</h3>

      <input
        id="paciente-nome"
        type="text"
        placeholder="Nome completo"
      >

      <input
        id="paciente-cpf"
        type="text"
        placeholder="CPF"
      >

      <label>Data de nascimento</label>

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
        type="text"
        placeholder="Telefone"
      >

      ${
        isManager()
          ? `
            <label>Profissional responsável</label>

            <select id="paciente-profissional">

              <option value="">
                Selecione
              </option>

              ${professionals.map(p => `
                <option value="${p.id}">
                  ${escapeHtml(p.name)}
                </option>
              `).join('')}

            </select>
          `
          : `
            <input
              type="hidden"
              id="paciente-profissional"
              value="${currentProfile.id}"
            >
          `
      }

      <textarea
        id="paciente-observacoes"
        placeholder="Observações"
      ></textarea>

      <button id="salvar-paciente">
        💾 Salvar paciente
      </button>

      <button id="cancelar-paciente">
        Cancelar
      </button>

      <div
        id="resultado-paciente"
        style="margin-top:10px;"
      ></div>

    </div>
  `

  document.querySelector(
    '#cancelar-paciente'
  ).onclick = () => {
    form.style.display = 'none'
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
      '⏳ Salvando paciente...'

    const { data, error } =
      await supabase
        .from('patients')
        .insert({
          name,
          cpf: cpf || null,
          birth_date: birthDate,
          guardian: guardian || null,
          phone: phone || null,
          notes: notes || null,
          professional_id: professionalId,
          clinic_id: currentProfile.clinic_id
        })
        .select()
        .single()

    if (error) {
      result.textContent =
        '❌ ' + error.message
      return
    }

    result.textContent =
      '✅ Paciente cadastrado com sucesso!'

    /*
      Depois de cadastrar, perguntamos se deseja
      colocar o primeiro horário na agenda.
    */

    setTimeout(() => {
      form.innerHTML = `
        <div class="box">

          <h3>
            ✅ Paciente cadastrado!
          </h3>

          <p>
            Deseja cadastrar um horário
            para ${escapeHtml(data.name)}?
          </p>

          <button id="sim-agendar">
            📅 Sim, agendar
          </button>

          <button id="nao-agendar">
            Agora não
          </button>

        </div>
      `

      document.querySelector(
        '#sim-agendar'
      ).onclick = async () => {

        form.innerHTML = `
          <div class="box">
            Carregando...
          </div>
        `

        const professionalList =
          await getProfessionals()

        const patients =
          await getPatients()

        form.innerHTML = `
          <div class="box">

            <h3>
              📅 Agendar ${escapeHtml(data.name)}
            </h3>

            <select id="ag-paciente">

              ${patients.map(p => `
                <option
                  value="${p.id}"
                  ${p.id === data.id ? 'selected' : ''}
                >
                  ${escapeHtml(p.name)}
                </option>
              `).join('')}

            </select>

            ${
              isManager()
                ? `
                  <select id="ag-profissional">

                    ${professionalList.map(p => `
                      <option
                        value="${p.id}"
                        ${p.id === data.professional_id
                          ? 'selected'
                          : ''}
                      >
                        ${escapeHtml(p.name)}
                      </option>
                    `).join('')}

                  </select>
                `
                : `
                  <input
                    type="hidden"
                    id="ag-profissional"
                    value="${currentProfile.id}"
                  >
                `
            }

            <input
              id="ag-data"
              type="date"
              value="${dateInputValue(new Date())}"
            >

            <input
              id="ag-inicio"
              type="time"
            >

            <input
              id="ag-fim"
              type="time"
            >

            <button id="salvar-agendamento">
              💾 Salvar horário
            </button>

            <div
              id="resultado-agendamento"
              style="margin-top:10px;"
            ></div>

          </div>
        `

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
            !date ||
            !startTime
          ) {
            result.textContent =
              '⚠️ Informe data e horário.'
            return
          }

          const { error } =
            await supabase
              .from('appointments')
              .insert({
                patient_id: patientId,
                professional_id: professionalId,
                appointment_date: date,
                start_time: startTime,
                end_time: endTime || null,
                status: 'agendado',
                clinic_id:
                  currentProfile.clinic_id
              })

          if (error) {
            result.textContent =
              '❌ ' + error.message
            return
          }

          result.textContent =
            '✅ Horário salvo!'

          setTimeout(() => {
            show('agenda')
          }, 700)
        }
      }

      document.querySelector(
        '#nao-agendar'
      ).onclick = () => {
        show('patients')
      }

    }, 700)
  }
}

/* =========================================================
   PROFISSIONAIS
========================================================= */

async function getProfessionals() {
  const { data, error } =
    await supabase
      .from('profiles')
      .select('id,name,role,clinic_id,active')
      .eq(
        'clinic_id',
        currentProfile.clinic_id
      )
      .eq('active', true)
      .in(
        'role',
        ['profissional', 'estagiaria']
      )
      .order('name')

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

async function renderTeam() {
  const container =
    document.querySelector('#page-content')

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

      <h3>👩‍⚕️ Equipe</h3>

      <p>
        Profissionais da clínica.
      </p>

      ${
        professionals.map(p => `
          <div class="appointment">

            <strong>
              ${escapeHtml(p.name)}
            </strong>

            <div>
              ${roleLabel(p.role)}
            </div>

          </div>
        `).join('')
      }

      <p style="margin-top:20px;">
        Para cadastrar uma nova profissional,
        utilize o cadastro administrativo já
        configurado no sistema.
      </p>

    </div>
  `
}

/* =========================================================
   EVOLUÇÕES
========================================================= */

async function renderEvolutions() {
  const container =
    document.querySelector('#page-content')

  let query =
    supabase
      .from('evolutions')
      .select('*')
      .order('evolution_date', {
        ascending: false
      })
      .order('evolution_time', {
        ascending: false
      })

  if (isProfessional()) {
    query = query.eq(
      'professional_id',
      currentProfile.id
    )
  }

  const { data, error } =
    await query

  if (error) {
    container.innerHTML =
      `<div class="box">❌ ${escapeHtml(error.message)}</div>`
    return
  }

  const patientIds =
    [...new Set(
      (data || [])
        .map(e => e.patient_id)
        .filter(Boolean)
    )]

  let patientsMap = {}

  if (patientIds.length) {
    const { data: patients } =
      await supabase
        .from('patients')
        .select('id,name')
        .in('id', patientIds)

    ;(patients || []).forEach(p => {
      patientsMap[p.id] = p.name
    })
  }

  container.innerHTML = `
    <div class="box">

      <h3>📝 Evoluções</h3>

      ${
        data?.length
          ? data.map(e => `
              <div class="appointment">

                <strong>
                  ${escapeHtml(
                    patientsMap[e.patient_id] ||
                    'Paciente'
                  )}
                </strong>

                <div>
                  ${formatDate(e.evolution_date)}
                  ${
                    e.evolution_time
                      ? ` às ${e.evolution_time.slice(0,5)}`
                      : ''
                  }
                </div>

                <p>
                  ${escapeHtml(e.text || '')}
                </p>

                <small>
                  Status:
                  ${escapeHtml(e.status || '')}
                </small>

              </div>
            `).join('')
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
   SUPERVISÃO
========================================================= */

async function renderSupervision() {
  const container =
    document.querySelector('#page-content')

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

      <h3>🔎 Área da supervisão</h3>

      <p>
        Você possui acesso às agendas,
        pacientes e evoluções das profissionais
        da clínica.
      </p>

      <div style="margin-top:20px;">

        ${professionals.map(p => `
          <div class="appointment">

            <strong>
              👩‍⚕️ ${escapeHtml(p.name)}
            </strong>

            <button
              data-professional="${p.id}"
              class="ver-agenda-profissional"
            >
              Ver agenda
            </button>

          </div>
        `).join('')}

      </div>

    </div>
  `

  document
    .querySelectorAll(
      '.ver-agenda-profissional'
    )
    .forEach(button => {

      button.onclick = () => {
        show('agenda')
      }

    })
}

/* =========================================================
   RECUPERAÇÃO DE SENHA
========================================================= */

supabase.auth.onAuthStateChange(
  async (event) => {

    if (event === 'PASSWORD_RECOVERY') {

      app.innerHTML = `
        <main class="login">

          <div class="box">

            <h1>🔐 Nova senha</h1>

            <input
              id="nova-senha"
              type="password"
              placeholder="Nova senha"
            >

            <button id="salvar-senha">
              Salvar nova senha
            </button>

            <div id="resultado-senha"></div>

          </div>

        </main>
      `

      document.querySelector(
        '#salvar-senha'
      ).onclick = async () => {

        const password =
          document.querySelector(
            '#nova-senha'
          ).value

        const result =
          document.querySelector(
            '#resultado-senha'
          )

        if (password.length < 6) {
          result.textContent =
            'A senha precisa ter pelo menos 6 caracteres.'
          return
        }

        const { error } =
          await supabase.auth.updateUser({
            password
          })

        if (error) {
          result.textContent =
            '❌ ' + error.message
          return
        }

        result.textContent =
          '✅ Senha alterada com sucesso!'

        setTimeout(() => {
          start()
        }, 1000)
      }
    }
  }
)

/* =========================================================
   INICIAR
========================================================= */

start()
