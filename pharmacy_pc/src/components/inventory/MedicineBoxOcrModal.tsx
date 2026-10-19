import React from 'react';
import SmartScannerModal, { SmartScannerModalProps } from '../common/SmartScannerModal';

export type MedicineBoxOcrModalProps = SmartScannerModalProps;
export const MedicineBoxOcrModal: React.FC<MedicineBoxOcrModalProps> = (props) => {
  return <SmartScannerModal {...props} />;
};

export default MedicineBoxOcrModal;
