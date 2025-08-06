import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { mockTurmas, mockEmpresas, mockPolos } from '@/data/mockData';
import { Aluno } from '@/types';

// Validação de CPF brasileira
const isValidCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  
  const cpfDigits = cpf.split('').map(el => +el);
  const rest = (count: number): number => {
    return (cpfDigits.slice(0, count-12)
      .reduce((soma, el, index) => (soma + el * (count-index)), 0) * 10) % 11 % 10;
  };
  return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10];
};

const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const alunoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .refine(isValidCPF, 'CPF inválido'),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  turma_id: z.string().min(1, 'Turma é obrigatória'),
  empresa_id: z.string().min(1, 'Empresa é obrigatória'),
  polo_id: z.string().min(1, 'Polo é obrigatório'),
  curso: z.string().min(1, 'Curso é obrigatório'),
  turno: z.enum(['Manhã', 'Tarde', 'Noite'], {
    required_error: 'Turno é obrigatório',
  }),
  dia_aula_semana: z.enum(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], {
    required_error: 'Dia da semana é obrigatório',
  }),
});

type AlunoFormData = z.infer<typeof alunoSchema>;

interface AlunoFormProps {
  aluno?: Aluno | null;
  onSubmit: (data: Omit<Aluno, 'id'>) => void;
  onCancel: () => void;
}

export function AlunoForm({ aluno, onSubmit, onCancel }: AlunoFormProps) {
  const form = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: aluno ? {
      nome: aluno.nome,
      cpf: aluno.cpf,
      matricula: aluno.matricula,
      turma_id: aluno.turma_id,
      empresa_id: aluno.empresa_id,
      polo_id: aluno.polo_id,
      curso: aluno.curso,
      turno: aluno.turno as 'Manhã' | 'Tarde' | 'Noite',
      dia_aula_semana: aluno.dia_aula_semana as 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta',
    } : {
      nome: '',
      cpf: '',
      matricula: '',
      turma_id: '1',
      empresa_id: '1',
      polo_id: '1',
      curso: '',
      turno: 'Manhã' as const,
      dia_aula_semana: 'Segunda' as const,
    },
  });

  const handleSubmit = (data: AlunoFormData) => {
    onSubmit({
      nome: data.nome,
      cpf: data.cpf,
      matricula: data.matricula,
      turma_id: data.turma_id,
      empresa_id: data.empresa_id,
      polo_id: data.polo_id,
      curso: data.curso,
      turno: data.turno,
      dia_aula_semana: data.dia_aula_semana,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="000.000.000-00"
                    {...field}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      field.onChange(formatted.replace(/\D/g, ''));
                    }}
                    value={formatCPF(field.value || '')}
                    maxLength={14}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="matricula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matrícula</FormLabel>
                <FormControl>
                  <Input placeholder="Digite a matrícula" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="curso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Curso</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o curso" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="turma_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turma</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockTurmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="empresa_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockEmpresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="polo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Polo/Unidade</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um polo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockPolos.map((polo) => (
                      <SelectItem key={polo.id} value={polo.id}>
                        {polo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="turno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turno</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dia_aula_semana"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia da Aula Teórica</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Segunda">Segunda-feira</SelectItem>
                    <SelectItem value="Terça">Terça-feira</SelectItem>
                    <SelectItem value="Quarta">Quarta-feira</SelectItem>
                    <SelectItem value="Quinta">Quinta-feira</SelectItem>
                    <SelectItem value="Sexta">Sexta-feira</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {aluno ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}