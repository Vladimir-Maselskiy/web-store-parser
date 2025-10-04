import React from 'react';
import { Button, Modal } from 'antd';

type TProps = {
  setIsExtensionChartShowed: React.Dispatch<React.SetStateAction<boolean>>;
  currentExtensionId: string;
};

export const ExtensionChart = ({
  setIsExtensionChartShowed,
  currentExtensionId,
}: TProps) => {
  const [open, setOpen] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState<boolean>(false);

  console.log('currentExtensionId', currentExtensionId);

  const showLoading = () => {
    setLoading(true);

    // Simple loading mock. You should add cleanup logic in real world.
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <>
      <Modal
        title={<p>Loading Modal</p>}
        footer={
          <Button type="primary" onClick={showLoading}>
            Reload
          </Button>
        }
        loading={loading}
        open={true}
        onCancel={() => setIsExtensionChartShowed(false)}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    </>
  );
};
