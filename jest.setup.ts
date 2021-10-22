import 'reflect-metadata';
import './globalmocks';
import { ContainerContextHolder } from './src/infrastructure/containerContext';

ContainerContextHolder.registerInContainer();
jest.setTimeout(10000);
