import React, { useCallback, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import cl from 'classnames';

import { useLogout } from 'src/hooks/useLogout';
import { useRootData } from 'hooks/useRootData';

import Portal from './Portal';
import { Transition } from 'components/Transition/Transition';
import Spinner from 'components/Spinner/Spinner';

import { WRONG_NETWORK } from 'constants/regExs.ts';
import { RIGHT_NETWORK_ID } from 'constants/networks';

import './Modal.scss';

export interface ModalProps {
  background: boolean;
  cancelAction?: any;
  children?: React.ReactNode;
  classSpecifier: string;
  visible: boolean;
  transition?: 'scale' | 'fly';
  centered?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  cancelAction,
  children,
  classSpecifier,
  visible,
  centered = false,
}) => {
  const {
    error,
    hintModal,
    isAccessModalOpen,
    isModalOpen,
    provider,
    setAccessModal,
    setError,
    setModal,
    setProvider,
    setWalletName,
    setZkWallet,
    walletName,
    zkWallet,
  } = useRootData(
    ({
      error,
      hintModal,
      isAccessModalOpen,
      isModalOpen,
      provider,
      walletName,
      zkWallet,
      ...rest
    }) => ({
      hintModal: hintModal.get(),
      error: error.get(),
      isAccessModalOpen: isAccessModalOpen.get(),
      isModalOpen: isModalOpen.get(),
      provider: provider.get(),
      walletName: walletName.get(),
      zkWallet: zkWallet.get(),
      ...rest,
    }),
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  const handleLogOut = useLogout();

  useEffect(() => {
    const body = document.body;
    if (isModalOpen) {
      body.classList.add('fixed');
    }
    return () => body.classList.remove('fixed');
  }, [isModalOpen]);

  const handleClickOutside = useCallback(
    e => {
      if (e.target !== overlayRef.current) return;
      if (
        e.target.getAttribute('data-name') &&
        !error.match(WRONG_NETWORK) &&
        !!zkWallet &&
        classSpecifier === isModalOpen
      ) {
        e.stopPropagation();
        setModal('');
        setError('');
      }
    },
    [error, setError, setModal, isModalOpen, classSpecifier, zkWallet],
  );

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () =>
      document.removeEventListener('click', handleClickOutside, true);
  }, [handleClickOutside]);

  const closeHandler = useCallback(() => {
    if (!!error.match(WRONG_NETWORK) && !!zkWallet) {
      return;
    } else {
      if (cancelAction) {
        cancelAction();
      } else {
        setModal('');
      }
      if (!zkWallet && !!walletName) {
        setProvider(null);
        setWalletName('');
        setAccessModal(false);
        setZkWallet(null);
        history.push('/');
        setModal('');
      }
    }
  }, [
    error,
    walletName,
    zkWallet,
    cancelAction,
    history,
    setAccessModal,
    setModal,
    setProvider,
    setWalletName,
    setZkWallet,
  ]);

  const shown = classSpecifier === isModalOpen || visible;

  const accessModalContent = () => (
    <>
      <h3 className='title-connecting'>
        {'Connecting to '}
        {walletName}
      </h3>
      <div
        className={`${walletName.replace(/\s+/g, '').toLowerCase()}-logo`}
      ></div>
      <p>{hintModal ? hintModal : 'Follow the instructions in the popup'}</p>
      <Spinner />
      <button
        className='btn submit-button'
        onClick={() => handleLogOut(false, '')}
      >
        {'Disconnect '}
        {walletName}
      </button>
    </>
  );

  const errorModalContent = () => (
    <>
      {zkWallet && error && provider.networkVersion === RIGHT_NETWORK_ID && (
        <button onClick={closeHandler} className='close-icon' />
      )}
      {!zkWallet && (
        <h3 className='title-connecting'>
          {'Connecting to '}
          {walletName}
        </h3>
      )}
      <div
        className={`${walletName.replace(/\s+/g, '').toLowerCase()}-logo`}
      ></div>
      <div className='wrong-network'>
        <div className='wrong-network-logo'></div>
        <p>{error}</p>
      </div>
      <button
        className='btn submit-button'
        onClick={() => handleLogOut(false, '')}
      >
        {'Disconnect '}
        {walletName}
      </button>
    </>
  );

  const plainModalContent = () => (
    <>
      <button onClick={closeHandler} className='close-icon' />
      {children}
    </>
  );

  return (
    <Portal className={cl(centered && 'center')}>
      <Transition type='modal' trigger={shown}>
        <div
          ref={overlayRef}
          data-name='modal-wrapper'
          className='modal-wrapper'
        >
          <div className={`modal ${classSpecifier}`}>
            {((isAccessModalOpen && !error) || (!zkWallet && !error)) &&
              accessModalContent()}
            {error && errorModalContent()}
            {zkWallet && !error && plainModalContent()}
          </div>
        </div>
      </Transition>
    </Portal>
  );
};

export default Modal;
