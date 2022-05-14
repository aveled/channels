export interface MotorOperationSuccess<M = string> {
    status: true;
    message?: M;
}

export interface MotorOperationError {
    status: false;
    error?: string;
}

export type MotorOperationStart =
    | 'started'
    | 'already_started';

export type MotorOperationStop =
    | 'stopped'
    | 'already_stopped';

export type MotorOperation<M = string> =
    | MotorOperationSuccess<M>
    | MotorOperationError;



// class MotorModbus {
//     constructor() {
//     }
// }


class Motor {
    constructor() {
    }

    public async start(): Promise<MotorOperation<MotorOperationStart>> {
        return {
            status: false,
        };
    }

    public async stop(): Promise<MotorOperation<MotorOperationStop>> {
        return {
            status: false,
        };
    }

    public async reverse(): Promise<MotorOperation> {
        return {
            status: false,
        };
    }

    public async speed(
        rpm: number,
    ): Promise<MotorOperation> {
        return {
            status: false,
        };
    }
}



export default Motor;
