import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarioGerado, CalendarioEvento } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import logoIphac from '@/assets/logo-iphac.png';

interface CalendarioImpressaoProps {
  calendario: CalendarioGerado;
}

export function CalendarioImpressao({ calendario }: CalendarioImpressaoProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarInstrucoes, setMostrarInstrucoes] = useState(false);

  // Receber dados do calendário via state da navegação
  const calendarioData = location.state?.calendario || calendario;

  if (!calendarioData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Calendário não encontrado</h2>
          <Button onClick={() => navigate('/calendario')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Calendário
          </Button>
        </div>
      </div>
    );
  }

  const mesesPorPagina = 6;
  const meses = obterMesesDoCalendario(calendarioData);
  const paginas = [];

  // Dividir meses em páginas de 6
  for (let i = 0; i < meses.length; i += mesesPorPagina) {
    paginas.push(meses.slice(i, i + mesesPorPagina));
  }

  const handleImprimir = () => {
    setMostrarInstrucoes(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <>
      {/* Interface de controle - oculta na impressão */}
      <div className="print:hidden bg-background p-4 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button 
            onClick={() => navigate('/calendario')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Calendário
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-semibold">Vista de Impressão - {calendarioData.aluno.nome}</h1>
            <p className="text-sm text-muted-foreground">Configure sua impressora para A4 e remova cabeçalhos/rodapés</p>
          </div>
          
          <Button onClick={handleImprimir} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Imprimir PDF
          </Button>
        </div>
      </div>

      {/* Modal de instruções */}
      {mostrarInstrucoes && (
        <div className="print:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Instruções para Impressão</h3>
            <ul className="space-y-2 text-sm mb-6">
              <li>• Selecione o formato A4</li>
              <li>• Remova cabeçalhos e rodapés</li>
              <li>• Use orientação retrato</li>
              <li>• Defina margens mínimas</li>
              <li>• Salve como PDF se desejar</li>
            </ul>
            <Button 
              onClick={() => setMostrarInstrucoes(false)} 
              className="w-full"
            >
              Entendi
            </Button>
          </div>
        </div>
      )}

      {/* Conteúdo para impressão */}
      <div className="calendario-impressao">
        {paginas.map((paginaMeses, indicePagina) => (
          <div key={indicePagina} className="pagina-calendario">
            {/* Cabeçalho da página */}
            <div className="cabecalho-pagina">
              <div className="logo-container">
                <img src={logoIphac} alt="IPHAC" className="logo-iphac" />
              </div>
              <div className="info-principal">
                <h1 className="titulo-principal">CALENDÁRIO ACADÊMICO</h1>
                <h2 className="nome-aluno">{calendarioData.aluno.nome}</h2>
                <div className="detalhes-aluno">
                  <span>Matrícula: {calendarioData.aluno.matricula}</span>
                  <span>Curso: {calendarioData.aluno.curso}</span>
                  <span>Turno: {calendarioData.aluno.turno}</span>
                </div>
              </div>
            </div>

            {/* Grid de calendários mensais */}
            <div className="grid-meses">
              {paginaMeses.map((mes) => (
                <div key={`${mes.ano}-${mes.mes}`} className="calendario-mensal">
                  <div className="cabecalho-mes">
                    <h3 className="titulo-mes">
                      {obterNomeMes(mes.mes)} {mes.ano}
                    </h3>
                  </div>
                  
                  <div className="grid-dias">
                    <div className="cabecalho-dias">
                      <div className="dia-header">DOM</div>
                      <div className="dia-header">SEG</div>
                      <div className="dia-header">TER</div>
                      <div className="dia-header">QUA</div>
                      <div className="dia-header">QUI</div>
                      <div className="dia-header">SEX</div>
                      <div className="dia-header">SÁB</div>
                    </div>
                    
                    <div className="dias-mes">
                      {mes.dias.map((dia, index) => (
                        <div 
                          key={`${dia.data.toISOString()}-${index}`}
                          className={`celula-dia ${dia.evento ? `evento-${dia.evento.tipo}` : ''} ${dia.isOutroMes ? 'outro-mes' : ''}`}
                        >
                          <div className="numero-dia">{dia.numero}</div>
                          {dia.evento && !dia.isOutroMes && (
                            <div className="evento-info">
                              <div className="evento-tipo">{obterTextoTipoEvento(dia.evento.tipo)}</div>
                              {dia.evento.disciplina && (
                                <div className="evento-disciplina">{dia.evento.disciplina}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legenda na primeira página */}
            {indicePagina === 0 && (
              <div className="legenda-eventos">
                <h4 className="titulo-legenda">LEGENDA</h4>
                <div className="itens-legenda">
                  <div className="item-legenda">
                    <div className="cor-evento evento-teorica"></div>
                    <span>Aula Teórica</span>
                  </div>
                  <div className="item-legenda">
                    <div className="cor-evento evento-pratica"></div>
                    <span>Atividade Prática</span>
                  </div>
                  <div className="item-legenda">
                    <div className="cor-evento evento-feriado"></div>
                    <span>Feriado</span>
                  </div>
                  <div className="item-legenda">
                    <div className="cor-evento evento-ferias"></div>
                    <span>Férias</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rodapé */}
            <div className="rodape-pagina">
              <div className="info-rodape">
                <span>Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
                <span>Página {indicePagina + 1} de {paginas.length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Funções auxiliares
function obterMesesDoCalendario(calendario: CalendarioGerado) {
  const dataInicio = new Date(calendario.data_inicio);
  const dataFim = new Date(calendario.data_fim);
  const meses: MesCalendario[] = [];

  let dataAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
  
  while (dataAtual <= dataFim) {
    const diasMes = obterDiasDoMes(dataAtual, calendario.eventos);
    meses.push({
      mes: dataAtual.getMonth() + 1,
      ano: dataAtual.getFullYear(),
      dias: diasMes
    });
    
    dataAtual.setMonth(dataAtual.getMonth() + 1);
  }

  return meses;
}

function obterDiasDoMes(primeiroDiaMes: Date, eventos: CalendarioEvento[]) {
  const ano = primeiroDiaMes.getFullYear();
  const mes = primeiroDiaMes.getMonth();
  const dias: DiaCalendario[] = [];

  // Obter todos os dias do mês (incluindo fins de semana)
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  // Adicionar dias vazios no início para alinhamento da grade (domingo = 0)
  const diaSemanaPrimeiroDia = primeiroDia.getDay();
  for (let i = 0; i < diaSemanaPrimeiroDia; i++) {
    const diaAnterior = new Date(primeiroDia);
    diaAnterior.setDate(diaAnterior.getDate() - (diaSemanaPrimeiroDia - i));
    dias.push({
      numero: diaAnterior.getDate(),
      data: new Date(diaAnterior),
      evento: undefined,
      isOutroMes: true
    });
  }

  // Adicionar todos os dias do mês atual
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const dataAtual = new Date(ano, mes, dia);
    const evento = eventos.find(e => 
      new Date(e.data).toDateString() === dataAtual.toDateString()
    );

    dias.push({
      numero: dia,
      data: new Date(dataAtual),
      evento,
      isOutroMes: false
    });
  }

  // Adicionar dias vazios no final para completar a grade
  const totalCelulas = Math.ceil(dias.length / 7) * 7;
  const diasRestantes = totalCelulas - dias.length;
  for (let i = 1; i <= diasRestantes; i++) {
    const proximoDia = new Date(ultimoDia);
    proximoDia.setDate(proximoDia.getDate() + i);
    dias.push({
      numero: proximoDia.getDate(),
      data: new Date(proximoDia),
      evento: undefined,
      isOutroMes: true
    });
  }

  return dias;
}

function obterNomeMes(numeroMes: number): string {
  const nomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return nomes[numeroMes - 1];
}

function obterTextoTipoEvento(tipo: CalendarioEvento['tipo']): string {
  const textos = {
    teorica: 'T',
    pratica: 'P',
    feriado: 'F',
    ferias: 'FÉR'
  };
  return textos[tipo];
}

interface MesCalendario {
  mes: number;
  ano: number;
  dias: DiaCalendario[];
}

interface DiaCalendario {
  numero: number;
  data: Date;
  evento?: CalendarioEvento;
  isOutroMes?: boolean;
}