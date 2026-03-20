import { createUsuarioSchema } from './src/server/schemas/index.js';

// Simulando o estado inicial vazio
let form = { nome: '', email: '', role: 'OPERADOR', departamento: '', cargo: '', cpf: '', telefone: '' };

// Simulando a digitação do usuário e o comportamento do useState
form.nome = 'Túlio Lima Lessa Carvalho';
form.email = 'tulio@saritur.com.br';
form.cpf = '093.531.476-89';
form.telefone = '(31) 99942-7107';
form.role = 'ADMIN';
form.departamento = 'Comercial';
form.cargo = 'Superintendente';

const bodyToSend = { 
    ...form, 
    cpf: form.cpf ? form.cpf : null, 
    telefone: form.telefone ? form.telefone : null 
};

try {
  let result = createUsuarioSchema.parse(bodyToSend);
  console.log('PASS ->', result);
} catch(e: any) {
  console.log('ERROR ->', JSON.stringify(e.errors, null, 2));
}
