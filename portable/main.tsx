import React from 'react';
import {createRoot} from 'react-dom/client';
import YarnTown from '../components/YarnTown';
import {OutfitProvider} from '../components/OutfitContext';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<OutfitProvider><YarnTown/></OutfitProvider>);
