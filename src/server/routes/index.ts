import { Router } from 'express';
import { authRouter } from './auth.js';
import { metasRouter } from './metas.js';
import { projetosRouter } from './projetos.js';
import { indicadoresRouter } from './indicadores.js';
import { usuariosRouter } from './usuarios.js';
import { auditoriaRouter } from './auditoria.js';
import { dashboardRouter } from './dashboard.js';
import { responsaveisRouter } from './responsaveis.js';
import { relatoriosRouter } from './relatorios.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/metas', metasRouter);
apiRouter.use('/projetos', projetosRouter);
apiRouter.use('/indicadores', indicadoresRouter);
apiRouter.use('/usuarios', usuariosRouter);
apiRouter.use('/auditoria', auditoriaRouter);
apiRouter.use('/responsaveis', responsaveisRouter);
apiRouter.use('/relatorios', relatoriosRouter);

